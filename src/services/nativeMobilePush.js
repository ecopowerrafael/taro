import { App } from '@capacitor/app'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { buildApiUrl } from '../utils/runtimeConfig'

const CapacitorIncomingCallKit = registerPlugin('FlutterCallkitIncoming', {
  web: () => Promise.resolve({
    onMethod: async () => {},
    addListener: async () => ({ remove: () => {} }),
  })
});

const APP_SCHEME = 'com.astria.taromobile'

const runtimeContext = {
  authToken: '',
  userId: '',
}

let listenersReady = false
const CriticalAlerts = registerPlugin('CriticalAlerts')

const getWarningMessage = (warning) => {
  if (warning === 'notificationsDisabled') {
    return 'ative as notificacoes do app'
  }
  if (warning === 'fullScreenIntent') {
    return 'permita notificacoes em tela cheia'
  }
  if (warning === 'batteryOptimization') {
    return 'remova a restricao de bateria da Astria'
  }
  return warning
}

export const isNativeAndroidApp = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'

export const getCriticalNotificationCapabilities = async () => {
  if (!isNativeAndroidApp()) {
    return {
      notificationsEnabled: true,
      fullScreenIntentAllowed: true,
      ignoringBatteryOptimizations: true,
      sdkInt: 0,
    }
  }

  try {
    return await CriticalAlerts.getCapabilities()
  } catch (error) {
    console.error('[native push] erro ao consultar capacidades nativas:', error)
    return {
      notificationsEnabled: true,
      fullScreenIntentAllowed: true,
      ignoringBatteryOptimizations: true,
      sdkInt: 0,
    }
  }
}

export const openCriticalNotificationSettings = async (warnings = []) => {
  if (!isNativeAndroidApp()) {
    return
  }

  const uniqueWarnings = [...new Set(warnings)]
  for (const warning of uniqueWarnings) {
    try {
      if (warning === 'notificationsDisabled') {
        await CriticalAlerts.openAppNotificationSettings()
      }
      if (warning === 'fullScreenIntent') {
        await CriticalAlerts.openFullScreenIntentSettings()
      }
      if (warning === 'batteryOptimization') {
        await CriticalAlerts.openBatteryOptimizationSettings()
      }
    } catch (error) {
      console.error('[native push] erro ao abrir configuracao nativa:', warning, error)
    }
  }
}

export const getRouteFromNativeUrl = (url) => {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== `${APP_SCHEME}:`) {
      return null
    }

    const path = parsed.host && parsed.host !== 'app'
      ? `/${parsed.host}${parsed.pathname}`
      : parsed.pathname || '/'

    return `${path}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
}

const syncNativeTokenWithBackend = async (tokenValue) => {
  if (!runtimeContext.authToken || !runtimeContext.userId || !tokenValue) {
    return
  }

  const appInfo = await App.getInfo().catch(() => null)

  try {
    const response = await fetch(buildApiUrl('/api/push/native/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${runtimeContext.authToken}`,
      },
      body: JSON.stringify({
        token: tokenValue,
        platform: 'android',
        provider: 'fcm',
        appVersion: appInfo?.version || null,
        deviceId: `${Capacitor.getPlatform()}-${runtimeContext.userId}`,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      console.error('[native push] falha ao sincronizar token:', error.error || error.message)
    }
  } catch (err) {
    console.error('[native push] erro ao sincronizar token:', err.message)
  }
}

const ensureListeners = () => {
  if (listenersReady) {
    return
  }

  PushNotifications.addListener('registration', (token) => {
    syncNativeTokenWithBackend(token?.value).catch((error) => {
      console.error('[native push] erro ao salvar token:', error)
    })
  })

  PushNotifications.addListener('registrationError', (error) => {
    console.error('[native push] erro de registro:', error)
  })

  PushNotifications.addListener('pushNotificationReceived', async (notification) => {
    console.log('[native push] push recebido:', notification?.title)
    
    // Injeta a chamada do Incoming Call Kit quando o firebase chegar com payload de vídeo
    if (notification?.data?.type === 'incoming_call' && notification?.data?.sessionId) {
      console.log('[native push] Interceptado como chamada de vídeo, disparando CallKit...')
      const callOptions = {
        options: "call_incoming",
        methodName: "showCallkitIncoming",
        parsedOptions: {
          id: notification.data.sessionId,
          nameCaller: notification.data.callerName || "Cliente",
          appName: "Astria Taro",
          avatar: "https://appastria.online/icon-192.png",
          handle: "Chamada de Vídeo",
          type: 1, 
          duration: 30000, 
          extra: {
            sessionId: notification.data.sessionId
          },
          android: {
            isCustomNotification: true,
            isShowLogo: true,
            ringtonePath: 'ringtone_default',
            backgroundColor: '#0F172A',
            backgroundUrl: 'https://appastria.online/icon-512.png',
            actionColor: '#4CAF50',
            textColor: '#FFFFFF',
            incomingCallNotificationChannelName: "Incoming Calls",
            missedCallNotificationChannelName: "Missed Calls",
            isShowFullLockedScreen: true,
            isImportant: true,
          }
        }
      };
      
      try {
        await CapacitorIncomingCallKit.onMethod(callOptions)
      } catch(err) {
        console.error('[native push] erro ao chamar CallKit:', err)
      }
    }
  })

  // Listener para quando o usuário atende ou recusa a ligação nativa tela preta
  CapacitorIncomingCallKit.addListener('com.hiennv.flutter_callkit_incoming.ACTION_CALL_ACCEPT', (event) => {
    console.log('[native push] CallKit: usuário aceitou chamada nativa!', event)
    const sessionId = event?.extra?.sessionId
    if (sessionId) {
      window.location.href = `/sala/${sessionId}`
    }
  });

  CapacitorIncomingCallKit.addListener('com.hiennv.flutter_callkit_incoming.ACTION_CALL_DECLINE', (event) => {
    console.log('[native push] CallKit: usuário recusou a chamada nativa', event)
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
    console.log('[native push] push clicado:', event?.actionId)
  })

  listenersReady = true
}

const ensureChannels = async () => {
  if (!isNativeAndroidApp()) return

  try {
    await PushNotifications.createChannel({
      id: 'incoming_calls_v2',
      name: 'Chamadas de Vídeo',
      description: 'Alertas de chamadas de vídeo recebidas',
      importance: 5, // IMPORTANCE_HIGH
      visibility: 1, // VISIBILITY_PUBLIC
      vibration: true,
    })

    await PushNotifications.createChannel({
      id: 'consultant_questions',
      name: 'Novas Perguntas (Consultor)',
      description: 'Avisos de novas perguntas enviadas por clientes',
      importance: 5,
      visibility: 1,
      vibration: true,
    })

    await PushNotifications.createChannel({
      id: 'client_answers',
      name: 'Respostas de Consultas',
      description: 'Avisos quando sua consulta for respondida',
      importance: 5,
      visibility: 1,
      vibration: true,
    })

    await PushNotifications.createChannel({
      id: 'general_updates',
      name: 'Atualizações Gerais',
      description: 'Notificações gerais e avisos do sistema',
      importance: 3, // IMPORTANCE_DEFAULT
      visibility: 1,
      vibration: true,
    })

    await PushNotifications.createChannel({
      id: 'default',
      name: 'Padrão',
      description: 'Notificações padrões',
      importance: 3,
      visibility: 1,
      vibration: true,
    })
  } catch (error) {
    console.warn('[native push] aviso ao criar canais:', error)
  }
}

export const initializeNativePush = async ({ authToken, userId }) => {
  if (!isNativeAndroidApp() || !authToken || !userId) {
    return { ok: false, message: 'Push nativo indisponível neste ambiente.' }
  }

  runtimeContext.authToken = authToken
  runtimeContext.userId = userId

  ensureListeners()

  try {
    const permission = await PushNotifications.requestPermissions()
    if (permission.receive !== 'granted') {
      return { ok: false, message: 'Permissão de notificação nativa negada.' }
    }

    await PushNotifications.register()
    await ensureChannels()

    const capabilities = await getCriticalNotificationCapabilities()
    const warnings = []

    if (capabilities.notificationsEnabled === false) {
      warnings.push('notificationsDisabled')
    }
    if (capabilities.fullScreenIntentAllowed === false) {
      warnings.push('fullScreenIntent')
    }
    if (capabilities.ignoringBatteryOptimizations === false) {
      warnings.push('batteryOptimization')
    }

    return {
      ok: true,
      capabilities,
      warnings,
      warningMessage:
        warnings.length > 0
          ? `Para chamadas em segundo plano, ${warnings.map(getWarningMessage).join(' e ')}.`
          : '',
    }
  } catch (err) {
    console.error('[native push] erro ao inicializar:', err)
    throw err
  }
}

export const attachNativeAppUrlListener = (onRoute) => {
  if (!isNativeAndroidApp() || typeof onRoute !== 'function') {
    return () => {}
  }

  let active = true
  const handle = App.addListener('appUrlOpen', ({ url }) => {
    if (!active) {
      return
    }

    const route = getRouteFromNativeUrl(url)
    if (route) {
      onRoute(route)
    }
  })

  return () => {
    active = false
    handle.remove()
  }
}