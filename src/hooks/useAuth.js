import { useState, useEffect, useCallback } from 'react'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || process.env.VITE_API_BASE_URL || '').trim()

export function useAuth() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('taro_token'))
  const [loading, setLoading] = useState(true)

  const buildApiUrl = (resource) => {
    const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
    const path = resource.startsWith('/') ? resource : `/${resource}`
    return `${base}${path}`
  }

  const fetchProfile = useCallback(async (tokenToUse) => {
    try {
      const response = await fetch(buildApiUrl('/api/auth/profile'), {
        headers: {
          Authorization: `Bearer ${tokenToUse}`
        }
      })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        logout()
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (token) {
      fetchProfile(token)
    } else {
      setLoading(false)
    }
  }, [token, fetchProfile])

  const login = async (email, password) => {
    try {
      const response = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(15000)
      })

      const data = await response.json()
      if (response.ok) {
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('taro_token', data.token)
        return { ok: true }
      } else {
        return { ok: false, message: data.message || 'Credenciais inválidas.' }
      }
    } catch (error) {
      console.error('Erro no login:', error)
      return { ok: false, message: 'Falha na conexão com o servidor.' }
    }
  }

  const register = async (userData) => {
    try {
      const response = await fetch(buildApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        signal: AbortSignal.timeout(15000) // Timeout de 15 segundos
      })

      const data = await response.json()
      if (response.ok) {
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('taro_token', data.token)
        return { ok: true }
      } else {
        return { ok: false, message: data.message || 'Erro no servidor.' }
      }
    } catch (error) {
      console.error('Erro no registro:', error)
      return { ok: false, message: 'Falha na conexão com o servidor. Verifique sua internet.' }
    }
  }

  const registerConsultant = async (consultantData) => {
    const response = await fetch(buildApiUrl('/api/auth/register-consultant'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consultantData)
    })

    const data = await response.json()
    if (response.ok) {
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('taro_token', data.token)
      return { ok: true }
    } else {
      return { ok: false, message: data.message }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('taro_token')
  }

  const updateProfile = async (updates) => {
    const response = await fetch(buildApiUrl('/api/auth/profile'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    })

    if (response.ok) {
      await fetchProfile(token)
      return { ok: true }
    } else {
      const data = await response.json()
      return { ok: false, message: data.message }
    }
  }

  return {
    user,
    token,
    loading,
    login,
    register,
    registerConsultant,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isConsultant: user?.role === 'consultant'
  }
}
