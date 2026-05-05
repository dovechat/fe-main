import apiClient from '../services/client'
import accountClient from '../services/accountClient'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8070'

export const register = async (email, phone, password, ifsms) => {
  const response = await accountClient.post('/auth/register', { email, phone, password, ifsms })
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