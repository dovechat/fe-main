import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register as apiRegister } from '../api/auth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [values, setValues] = useState({ email: '', phone: '+', password: '', ifsms: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setValues(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (error) setError('')
  }

  const switchMode = (m) => {
    setMode(m)
    setError('')
    setValues({ email: '', phone: '+', password: '', ifsms: false })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (mode === 'register') {
      const digits = values.phone.replace(/\D/g, '')
      if (digits.length < 9) { setError('Телефон должен содержать минимум 9 цифр'); return }
    }
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(values.email, values.password)
        navigate('/chats')
      } else {
        await apiRegister(values.email, values.phone, values.password, values.ifsms)
        alert('Регистрация успешна. Проверьте email для подтверждения.')
        switchMode('login')
      }
    } catch (err) {
      setError(err.response?.data?.detail || (mode === 'login' ? 'Ошибка входа' : 'Ошибка регистрации'))
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

        <h2 className="login-title">{mode === 'login' ? 'Вход' : 'Регистрация'}</h2>

        <form onSubmit={onSubmit} autoComplete="off">

          <div className="login-field">
            <label>Email</label>
            <input
              type="email" name="email" value={values.email}
              onChange={handleChange} required placeholder="you@example.com"
            />
          </div>

          {mode === 'register' && (
            <div className="login-field">
              <label>Телефон</label>
              <input
                type="tel" name="phone" value={values.phone}
                onChange={handleChange} required placeholder="+79991234567"
              />
            </div>
          )}

          <div className="login-field">
            <label>Пароль{mode === 'register' ? ' (минимум 8 символов)' : ''}</label>
            <input
              type="password" name="password" value={values.password}
              onChange={handleChange} required autoComplete="new-password"
              minLength={mode === 'register' ? 8 : undefined}
            />
          </div>

          {mode === 'register' && (
            <div className="login-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" name="ifsms" checked={values.ifsms} onChange={handleChange} style={{ width: 'auto', margin: 0 }} />
              <span style={{ fontSize: '13px', color: '#555' }}> Получить код подтверждения по SMS</span>
            </div>
          )}

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>

        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#666' }}>
          {mode === 'login' ? (
            <>Нет аккаунта?{' '}
              <button onClick={() => switchMode('register')} style={{ background: 'none', border: 'none', color: '#4A7FFF', cursor: 'pointer', fontSize: '13px', padding: 0 }}>
                Зарегистрироваться
              </button>
            </>
          ) : (
            <>Уже есть аккаунт?{' '}
              <button onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', color: '#4A7FFF', cursor: 'pointer', fontSize: '13px', padding: 0 }}>
                Войти
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}