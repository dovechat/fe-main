import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(values.email, values.password)
      navigate('/chats')
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Вход"
      footer={
        <>
          Нет аккаунта? <Link to="/register" className="login-footer-link">Зарегистрироваться</Link>
        </>
      }
    >
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
            autoComplete="current-password"
          />
        </div>
        {error && <div className="login-error">{error}</div>}
        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? '...' : 'Войти'}
        </button>
      </form>
    </AuthLayout>
  )
}
