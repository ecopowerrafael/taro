const DEFAULT_VIBRATION_PATTERN = [300, 120, 300, 120, 500]

const isBrowserEnvironment = typeof window !== 'undefined'

const createWebSocketUrl = (consultantId) => {
  if (!isBrowserEnvironment) {
    return null
  }

  const configuredUrl = (import.meta.env.VITE_CONSULTANT_WS_URL ?? '').trim()
  const baseUrl =
    configuredUrl ||
    `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`

  try {
    const url = new URL(baseUrl)
    url.searchParams.set('consultantId', consultantId)
    return url.toString()
  } catch {
    return null
  }
}

export class ConsultantAvailabilityService {
  constructor() {
    this.isOnline = false
    this.consultantId = null
    this.consultantName = ''
    this.onIncomingCall = null
    this.onError = null
    this.socket = null
    this.wakeLockSentinel = null
    this.mediaStream = null
    this.audioContext = null
    this.ringtoneOscillator = null
    this.ringtoneGain = null
    this.ringtoneInterval = null
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this)
  }

  async goOnline({ consultantId, consultantName, onIncomingCall, onError }) {
    if (!consultantId) {
      return false
    }

    if (this.isOnline && this.consultantId === consultantId) {
      return true
    }

    await this.goOffline()

    this.isOnline = true
    this.consultantId = consultantId
    this.consultantName = consultantName ?? 'Consultor'
    this.onIncomingCall = onIncomingCall ?? null
    this.onError = onError ?? null

    await this.requestMediaPermissions()
    await this.requestNotificationPermission()
    await this.requestWakeLock()
    this.setupVisibilityListener()
    this.connectWebSocket()
    return true
  }

  async goOffline() {
    this.isOnline = false
    this.consultantId = null
    this.consultantName = ''
    this.onIncomingCall = null
    this.closeWebSocket()
    await this.releaseWakeLock()
    this.clearVisibilityListener()
    this.stopIncomingCallAlert()
    await this.closeIncomingNotifications()
  }

  async requestMediaPermissions() {
    if (!isBrowserEnvironment) {
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      return
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      this.mediaStream.getTracks().forEach((track) => track.stop())
      this.mediaStream = null
    } catch (error) {
      this.onError?.('Permissões de câmera e microfone não concedidas.')
      throw error
    }
  }

  async requestNotificationPermission() {
    if (!isBrowserEnvironment) {
      return
    }
    if (!('Notification' in window)) {
      return
    }
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission()
      } catch {
        this.onError?.('Falha ao solicitar permissão de notificações.')
      }
    }
  }

  async requestWakeLock() {
    if (!isBrowserEnvironment) {
      return
    }
    if (!('wakeLock' in navigator)) {
      return
    }
    if (!this.isOnline || document.visibilityState !== 'visible') {
      return
    }
    try {
      this.wakeLockSentinel = await navigator.wakeLock.request('screen')
      this.wakeLockSentinel.addEventListener('release', () => {
        this.wakeLockSentinel = null
      })
    } catch {
      this.onError?.('Não foi possível manter a tela ativa com Wake Lock.')
    }
  }

  async releaseWakeLock() {
    if (!this.wakeLockSentinel) {
      return
    }
    try {
      await this.wakeLockSentinel.release()
    } finally {
      this.wakeLockSentinel = null
    }
  }

  setupVisibilityListener() {
    if (!isBrowserEnvironment) {
      return
    }
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
  }

  clearVisibilityListener() {
    if (!isBrowserEnvironment) {
      return
    }
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
  }

  async handleVisibilityChange() {
    if (!this.isOnline) {
      return
    }
    if (document.visibilityState === 'visible') {
      await this.requestWakeLock()
    } else {
      await this.releaseWakeLock()
    }
  }

  connectWebSocket() {
    if (!this.consultantId) {
      return
    }
    const wsUrl = createWebSocketUrl(this.consultantId)
    if (!wsUrl) {
      this.onError?.('URL do WebSocket inválida para disponibilidade do consultor.')
      return
    }

    try {
      this.socket = new WebSocket(wsUrl)
      this.socket.onmessage = (event) => {
        this.handleSocketMessage(event.data)
      }
      this.socket.onerror = () => {
        this.onError?.('Conexão WebSocket indisponível para receber chamadas.')
      }
      this.socket.onclose = () => {
        this.socket = null
      }
    } catch {
      this.onError?.('Falha ao iniciar conexão WebSocket.')
    }
  }

  closeWebSocket() {
    if (!this.socket) {
      return
    }
    this.socket.close()
    this.socket = null
  }

  handleSocketMessage(rawData) {
    let payload = null
    try {
      payload = JSON.parse(rawData)
    } catch {
      return
    }
    if (payload?.type !== 'incoming_call') {
      return
    }
    this.triggerIncomingCallAlert(payload)
  }

  async triggerIncomingCallAlert(payload) {
    this.startRingtone()
    await this.showIncomingCallNotification(payload)
    this.onIncomingCall?.(payload)
  }

  startRingtone() {
    if (!isBrowserEnvironment) {
      return
    }
    if (this.ringtoneOscillator) {
      return
    }
    try {
      this.audioContext = new window.AudioContext()
      this.ringtoneOscillator = this.audioContext.createOscillator()
      this.ringtoneGain = this.audioContext.createGain()
      this.ringtoneOscillator.type = 'sine'
      this.ringtoneOscillator.frequency.setValueAtTime(880, this.audioContext.currentTime)
      this.ringtoneGain.gain.setValueAtTime(0, this.audioContext.currentTime)
      this.ringtoneOscillator.connect(this.ringtoneGain)
      this.ringtoneGain.connect(this.audioContext.destination)
      this.ringtoneOscillator.start()

      let isPulseOn = false
      this.ringtoneInterval = window.setInterval(() => {
        if (!this.audioContext || !this.ringtoneGain) {
          return
        }
        isPulseOn = !isPulseOn
        const targetGain = isPulseOn ? 0.12 : 0
        this.ringtoneGain.gain.cancelScheduledValues(this.audioContext.currentTime)
        this.ringtoneGain.gain.linearRampToValueAtTime(targetGain, this.audioContext.currentTime + 0.04)
      }, 380)
    } catch {
      this.onError?.('Não foi possível iniciar o áudio de chamada.')
    }
  }

  stopIncomingCallAlert() {
    if (this.ringtoneInterval) {
      window.clearInterval(this.ringtoneInterval)
      this.ringtoneInterval = null
    }
    if (this.ringtoneOscillator) {
      this.ringtoneOscillator.stop()
      this.ringtoneOscillator.disconnect()
      this.ringtoneOscillator = null
    }
    if (this.ringtoneGain) {
      this.ringtoneGain.disconnect()
      this.ringtoneGain = null
    }
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }

  async showIncomingCallNotification(payload) {
    if (!isBrowserEnvironment) {
      return
    }
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return
    }

    const body = `${payload?.callerName ?? 'Cliente'} está chamando você agora.`
    const options = {
      body,
      tag: 'incoming_call',
      renotify: true,
      requireInteraction: true,
      vibrate: DEFAULT_VIBRATION_PATTERN,
      data: {
        focusUrl: '/area-consultor',
      },
    }

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification('Chamada recebida', options)
        return
      } catch {
        this.onError?.('Falha ao enviar notificação pelo service worker.')
      }
    }

    const notification = new Notification('Chamada recebida', options)
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  }

  async closeIncomingNotifications() {
    if (!isBrowserEnvironment || !('serviceWorker' in navigator)) {
      return
    }
    try {
      const registration = await navigator.serviceWorker.ready
      const notifications = await registration.getNotifications({ tag: 'incoming_call' })
      notifications.forEach((item) => item.close())
    } catch {
      this.onError?.('Falha ao limpar notificações de chamada.')
    }
  }
}
