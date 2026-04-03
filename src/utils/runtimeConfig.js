import { Capacitor } from '@capacitor/core'

const PROD_API_BASE_URL = 'https://appastria.online'
const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim()

export const isNativeApp = () => Capacitor.isNativePlatform()

export const isNativeAndroidApp = () => isNativeApp() && Capacitor.getPlatform() === 'android'

export const getApiBaseUrl = () => {
  if (RAW_API_BASE_URL) {
    return RAW_API_BASE_URL.replace(/\/$/, '')
  }

  if (isNativeApp()) {
    return PROD_API_BASE_URL
  }

  return ''
}

export const buildApiUrl = (resource) => {
  const path = resource.startsWith('/') ? resource : `/${resource}`
  const base = getApiBaseUrl()

  if (!base) {
    return path
  }

  return `${base}${path}`
}

const shouldRewriteRequest = (value) => {
  if (!value) {
    return false
  }

  if (typeof value === 'string') {
    return value.startsWith('/api/') || value === '/api' || value.startsWith('http://localhost') || value.startsWith('https://localhost')
  }

  return false
}

const rewriteRequestUrl = (value) => {
  if (!shouldRewriteRequest(value)) {
    return value
  }

  if (value.startsWith('/api')) {
    return buildApiUrl(value)
  }

  try {
    const parsed = new URL(value)
    return `${getApiBaseUrl()}${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return value
  }
}

export const installNativeFetchBridge = () => {
  if (!isNativeApp() || typeof window === 'undefined' || typeof window.fetch !== 'function') {
    return
  }

  if (window.__astriaFetchBridgeInstalled) {
    return
  }

  const originalFetch = window.fetch.bind(window)

  window.fetch = (input, init) => {
    if (typeof input === 'string') {
      return originalFetch(rewriteRequestUrl(input), init)
    }

    if (input instanceof Request) {
      const rewrittenUrl = rewriteRequestUrl(input.url)
      if (rewrittenUrl === input.url) {
        return originalFetch(input, init)
      }

      const request = new Request(rewrittenUrl, input)
      return originalFetch(request, init)
    }

    return originalFetch(input, init)
  }

  window.__astriaFetchBridgeInstalled = true
}