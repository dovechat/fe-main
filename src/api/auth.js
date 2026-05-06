import apiClient from '../services/client'
import accountClient from '../services/accountClient'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8070'

export const register = async (email, phone, ifsms) => {
  const response = await accountClient.post('/auth/register', { email, phone, ifsms })
  return response.data
}

export const login = async (username, password) => {
  const formData = new URLSearchParams()
  formData.append('username', username)
  formData.append('password', password)

  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Ошибка входа')
  }

  return await response.json()
}

export const verify = async (token, code) => {
  const response = await fetch(`${API_URL}/auth/verify?code=${code}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Ошибка верификации')
  }
  return await response.json()
}

export const setPassword = async (tempToken, password) => {
  const response = await accountClient.post(
    '/auth/set-password',
    { password },
    { headers: { Authorization: `Bearer ${tempToken}` } }
  )
  return response.data
}