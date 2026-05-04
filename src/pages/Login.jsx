import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value })
    if (error) setError('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(values.email, values.password)
      navigate('/chats')
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">🕊</span>
          <span className="login-logo-text">DoveChat</span>
        </div>
        <h2 className="login-title">Вход</h2>
        <form onSubmit={onSubmit} autoComplete="off">
          <div className="login-field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="login-field">
            <label>Пароль</label>
            <input
              type="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}