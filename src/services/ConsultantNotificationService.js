import { io } from 'socket.io-client'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim()

const getRealtimeServerUrl = () => {
  if (!API_BASE_URL) {
    return window.location.origin
  }

  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return window.location.origin
  }
}

class ConsultantNotificationService {
  constructor() {
    this.socket = null
    this.audio = null
    this.audioContext = null
    this.fallbackToneInterval = null
    this.wakeLock = null
    this.consultantId = null
    this.onIncomingCall = null
    this.listeners = {
      incoming_call: new Set(),
      new_question: new Set(),
    }
    this.isRinging = false
    this.setupAudio()
  }

  on(eventName, handler) {
    if (!this.listeners[eventName] || typeof handler !== 'function') {
      return
    }
    this.listeners[eventName].add(handler)
  }

  off(eventName, handler) {
    if (!this.listeners[eventName] || typeof handler !== 'function') {
      return
    }
    this.listeners[eventName].delete(handler)
  }

  emit(eventName, payload) {
    if (!this.listeners[eventName]) {
      return
    }
    this.listeners[eventName].forEach((handler) => {
      try {
        handler(payload)
      } catch (error) {
        console.error(`[ConsultantNotificationService] erro no listener ${eventName}:`, error)
      }
    })
  }

  setupAudio() {
    this.audio = new Audio('/ringtone.mp3')
    this.audio.loop = true
    this.audio.preload = 'auto'
  }

  async primeAudio() {
    try {
      if (!this.audioContext && 'AudioContext' in window) {
        this.audioContext = new window.AudioContext()
      }

      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume()
      }

      if (this.audio) {
        this.audio.muted = true
        await this.audio.play()
        this.audio.pause()
        this.audio.currentTime = 0
        this.audio.muted = false
      }
    } catch (error) {
      console.warn('[ConsultantNotificationService] Não foi possível preparar áudio:', error)
    }
  }

  startFallbackToneLoop() {
    if (!this.audioContext || this.fallbackToneInterval) {
      return
    }

    const playBeep = () => {
      try {
        const startAt = this.audioContext.currentTime
        const steps = [
          { frequency: 1046, duration: 0.16, delay: 0 },
          { frequency: 1318, duration: 0.18, delay: 0.2 },
        ]

        steps.forEach(({ frequency, duration, delay }) => {
          const oscillator = this.audioContext.createOscillator()
          const gainNode = this.audioContext.createGain()

          oscillator.type = 'square'
          oscillator.frequency.setValueAtTime(frequency, startAt + delay)
          gainNode.gain.setValueAtTime(0.001, startAt + delay)
          gainNode.gain.exponentialRampToValueAtTime(0.16, startAt + delay + 0.02)
          gainNode.gain.exponentialRampToValueAtTime(0.001, startAt + delay + duration)

          oscillator.connect(gainNode)
          gainNode.connect(this.audioContext.destination)

          oscillator.start(startAt + delay)
          oscillator.stop(startAt + delay + duration)
        })
      } catch (error) {
        console.warn('[ConsultantNotificationService] Falha no beep alternativo:', error)
      }
    }

    playBeep()
    this.fallbackToneInterval = window.setInterval(playBeep, 900)
  }

  async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await navigator.wakeLock.request('screen')
        this.wakeLock.addEventListener('release', () => {
          // Se soltou por algum motivo (minimizou), tenta pegar de novo se ainda online
          if (this.socket && this.socket.connected) {
            this.requestWakeLock()
          }
        })
      }
    } catch (err) {
      console.error('Wake Lock failed:', err)
    }
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release()
      this.wakeLock = null
    }
  }

  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  connect(consultantId, onIncomingCall = null) {
    if (this.socket) return

    this.consultantId = consultantId
    this.onIncomingCall = onIncomingCall

    this.socket = io(getRealtimeServerUrl())

    this.socket.on('connect', () => {
      this.socket.emit('join_consultant_room', consultantId)
      this.requestWakeLock()
      this.requestNotificationPermission()
      this.primeAudio()
    })

    this.socket.on('incoming_call', (data) => {
      this.playRingtone()
      this.showNotification(data)
      this.emit('incoming_call', data)
      if (typeof this.onIncomingCall === 'function') {
        this.onIncomingCall(data)
      }
    })

    this.socket.on('new_question', (data) => {
      this.emit('new_question', data)
    })
  }

  disconnect() {
    this.onIncomingCall = null
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.stopRingtone()
    this.releaseWakeLock()
  }

  playRingtone() {
    if (this.isRinging) return
    this.isRinging = true

    this.primeAudio().finally(() => {
      this.audio.play().catch((error) => {
        console.warn('Erro ao tocar ringtone por arquivo, usando beep alternativo:', error)
        this.startFallbackToneLoop()
      })
    })

    if ('vibrate' in navigator) {
      navigator.vibrate([700, 250, 700, 250, 700, 250, 700])
    }
  }

  stopRingtone() {
    this.isRinging = false
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
    }
    if (this.fallbackToneInterval) {
      window.clearInterval(this.fallbackToneInterval)
      this.fallbackToneInterval = null
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0)
    }
  }

  async showNotification(data) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return
    }

    const notificationOptions = {
      body: `O cliente ${data.customerName} está aguardando você na sala.`,
      icon: '/logoastria.png',
      badge: '/logoastria.png',
      vibrate: [700, 250, 700],
      requireInteraction: true,
      tag: `incoming_call_${data.sessionId}`,
      data: {
        url: `/sala/${data.sessionId}`,
      },
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification('Nova Chamada de Vídeo!', notificationOptions)
        return
      }
    } catch (error) {
      console.warn('[ConsultantNotificationService] Falha ao mostrar via service worker:', error)
    }

    const notification = new Notification('Nova Chamada de Vídeo!', notificationOptions)
    notification.onclick = () => {
      window.focus()
      notification.close()
      this.stopRingtone()
      window.location.href = `/sala/${data.sessionId}`
    }
  }
}

export const notificationService = new ConsultantNotificationService()