import { useEffect, useState } from 'react'
import { api, clearSession, storeSession } from './api'
import { AuthContext } from './auth-context'

function readUser() {
  try {
    if (!localStorage.getItem('qa_access_token')) return null
    return JSON.parse(localStorage.getItem('qa_user'))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const expire = () => setUser(null)
    window.addEventListener('auth:expired', expire)
    return () => window.removeEventListener('auth:expired', expire)
  }, [])

  const authenticate = async (path, credentials) => {
    setAuthError('')
    try {
      const { data } = await api.post(path, credentials)
      storeSession(data)
      setUser({ username: data.username, role: data.role })
      return data
    } catch (error) {
      const message = error.response?.data?.error || 'Authentication failed. Please try again.'
      setAuthError(message)
      throw error
    }
  }

  const login = (credentials) => authenticate('/auth/login', credentials)
  const register = (credentials) => authenticate('/auth/register', credentials)
  const logout = async () => {
    try {
      if (user) await api.post('/auth/logout')
    } finally {
      clearSession()
      setUser(null)
    }
  }

  return <AuthContext.Provider value={{ user, login, register, logout, authError, setAuthError }}>
    {children}
  </AuthContext.Provider>
}

