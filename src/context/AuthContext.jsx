import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin } from '../api/auth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [tenantId, setTenantId] = useState(null)
  const [loading, setLoading] = useState(true)

  const parseTenantId = (t) => {
    try { return JSON.parse(atob(t.split('.')[1])).tenant_id || null } catch { return null }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedEmail = localStorage.getItem('user_email')
    if (savedToken) {
      setToken(savedToken)
      setUser(savedEmail ? { email: savedEmail } : null)
      setTenantId(parseTenantId(savedToken))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const data = await apiLogin(email, password)
    setToken(data.access_token)
    setUser({ email })
    setTenantId(parseTenantId(data.access_token))
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.setItem('user_email', email)
    return data
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setTenantId(null)
    localStorage.clear()
    window.location.href = '/login'
  }

  const updateToken = (newToken, newRefreshToken) => {
    setToken(newToken)
    setTenantId(parseTenantId(newToken))
    localStorage.setItem('token', newToken)
    if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken)
  }

  return (
    <AuthContext.Provider value={{
      user, token, tenantId, loading, login, logout, updateToken,
      isAuthenticated: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth вне AuthProvider')
  return ctx
}