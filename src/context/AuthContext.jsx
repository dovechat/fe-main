import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin } from '../api/auth'
import { switchTenant } from '../api/tenants'

const AuthContext = createContext(null)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [tenantId, setTenantId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentTenant, setCurrentTenantState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('current_tenant')) || null } catch { return null }
  })
  const setCurrentTenant = (tenant) => {
    setCurrentTenantState(tenant)
    if (tenant) localStorage.setItem('current_tenant', JSON.stringify(tenant))
    else localStorage.removeItem('current_tenant')
  }
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
    try {
      const map = JSON.parse(localStorage.getItem('tenant_by_email') || '{}')
      const savedTenantId = map[email]
      if (savedTenantId) {
        const switched = await switchTenant(savedTenantId)
        if (switched?.access_token) {
          setToken(switched.access_token)
          setTenantId(parseTenantId(switched.access_token))
          localStorage.setItem('token', switched.access_token)
          if (switched.refresh_token) localStorage.setItem('refresh_token', switched.refresh_token)
          setCurrentTenant({ id: savedTenantId })
        }
      }
    } catch {}
    return data
  }
  const logout = () => {
    const email = localStorage.getItem('user_email')
    const currentTenantRaw = localStorage.getItem('current_tenant')
    const mapRaw = localStorage.getItem('tenant_by_email')
    setToken(null)
    setUser(null)
    setTenantId(null)
    setCurrentTenantState(null)
    localStorage.clear()
    try {
      const map = JSON.parse(mapRaw || '{}')
      if (email && currentTenantRaw) {
        const t = JSON.parse(currentTenantRaw)
        map[email] = t.id
      }
      localStorage.setItem('tenant_by_email', JSON.stringify(map))
    } catch {}
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
      user, token, tenantId, loading, login, logout, updateToken, currentTenant, setCurrentTenant,
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