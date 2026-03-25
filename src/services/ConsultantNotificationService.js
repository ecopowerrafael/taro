import { io } from 'socket.io-client'

class ConsultantNotificationService {
  constructor() {
    this.socket = null
    this.audio = null
    this.wakeLock = null
    this.consultantId = null
    this.onIncomingCall = null
    this.isRinging = false
    this.setupAudio()
  }

  setupAudio() {
    // Usamos um ringtone simples que o navegador suporte (você pode colocar um mp3 real em public/ringtone.mp3)
    // Para fallback usaremos um som gerado ou um path que podemos criar depois
    this.audio = new Audio('/ringtone.mp3') // Crie um arquivo ringtone.mp3 na pasta public
    this.audio.loop = true
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

    // Conecta ao mesmo domínio/porta do servidor atual
    this.socket = io(window.location.origin)

    this.socket.on('connect', () => {
      this.socket.emit('join_consultant_room', consultantId)
      this.requestWakeLock()
      this.requestNotificationPermission()
    })

    this.socket.on('incoming_call', (data) => {
      this.playRingtone()
      this.showNotification(data)
      if (typeof this.onIncomingCall === 'function') {
        this.onIncomingCall(data)
      }
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
    
    // Tenta tocar o áudio
    this.audio.play().catch(e => console.error('Erro ao tocar ringtone (interação de usuário requerida):', e))

    // Tenta vibrar o celular
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 250, 500, 250, 500, 250, 500, 250, 500]) // Padrão de chamada
    }
  }

  stopRingtone() {
    this.isRinging = false
    this.audio.pause()
    this.audio.currentTime = 0
    if ('vibrate' in navigator) {
      navigator.vibrate(0) // Para a vibração
    }
  }

  showNotification(data) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification('Nova Chamada de Vídeo!', {
        body: `O cliente ${data.customerName} está aguardando você na sala.`,
        icon: '/logoastria.png',
        vibrate: [500, 250, 500],
        requireInteraction: true, // Mantém a notificação até ser clicada
        tag: 'incoming_call'
      })

      notif.onclick = () => {
        window.focus() // Traz a aba pro foco
        notif.close()
        this.stopRingtone()
        // Redireciona o consultor para a sala
        window.location.href = `/sala/${data.sessionId}`
      }
    } else {
      // Fallback visual se não tiver permissão
      alert(`NOVA CHAMADA DE VÍDEO!\nO cliente ${data.customerName} está esperando.`)
      this.stopRingtone()
    }
  }
}

export const notificationService = new ConsultantNotificationService()