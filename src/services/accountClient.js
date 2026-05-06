import axios from 'axios'

const accountClient = axios.create({
  baseURL: import.meta.env.VITE_ACCOUNT_URL,
  headers: { 'Content-Type': 'application/json' },
})

accountClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

accountClient.interceptors.response.use(
  r => r,
  error => {
    const msg = error.response?.data?.detail
    if (msg && typeof msg === 'string') alert(msg)
    return Promise.reject(error)
  }
)

export default accountClient