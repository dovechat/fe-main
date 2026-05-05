import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register as apiRegister, verify as apiVerify } from '../api/auth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  // mode: 'login' | 'register' | 'verify'
  const [mode, setMode] = useState('login')
  const [values, setValues] = useState({ email: '', phone: '+', password: '', ifsms: false })
  const [code, setCode] = useState('')
  const [tempToken, setTempToken] = useState(null)
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
    setCode('')
    setTempToken(null)
  }

  const onSubmitLogin = async (e) => {
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

  const onSubmitRegister = async (e) => {
    e.preventDefault()
    const digits = values.phone.replace(/\D/g, '')
    if (digits.length < 9) { setError('Телефон должен содержать минимум 9 цифр'); return }
    setLoading(true)
    try {
      const data = await apiRegister(values.email, values.phone, values.password, values.ifsms)
      setTempToken(data.access_token)
      setMode('verify')
      setError('')
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const onSubmitVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await apiVerify(tempToken, code)
      await login(values.email, values.password)
      navigate('/chats')
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Неверный код')
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

        <h2 className="login-title">
          {mode === 'login' ? 'Вход' : mode === 'register' ? 'Регистрация' : 'Подтверждение email'}
        </h2>

        {/* Вход */}
        {mode === 'login' && (
          <form onSubmit={onSubmitLogin} autoComplete="off">
            <div className="login-field">
              <label>Email</label>
              <input type="email" name="email" value={values.email} onChange={handleChange} required placeholder="you@example.com" />
            </div>
            <div className="login-field">
              <label>Пароль</label>
              <input type="password" name="password" value={values.password} onChange={handleChange} required autoComplete="new-password" />
            </div>
            {error && <div className="login-error">{error}</div>}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? '...' : 'Войти'}
            </button>
          </form>
        )}

        {/* Регистрация */}
        {mode === 'register' && (
          <form onSubmit={onSubmitRegister} autoComplete="off">
            <div className="login-field">
              <label>Email</label>
              <input type="email" name="email" value={values.email} onChange={handleChange} required placeholder="you@example.com" />
            </div>
            <div className="login-field">
              <label>Телефон</label>
              <input type="tel" name="phone" value={values.phone} onChange={handleChange} required placeholder="+79991234567" />
            </div>
            <div className="login-field">
              <label>Пароль (минимум 8 символов)</label>
              <input type="password" name="password" value={values.password} onChange={handleChange} required autoComplete="new-password" minLength={8} />
            </div>
            <div className="login-field">
              <label style={{ display: 'flex', gap: '8px', fontWeight: 'normal', cursor: 'pointer' }}>
                <input type="checkbox" name="ifsms" checked={values.ifsms} onChange={handleChange} style={{ width: 'auto', flexShrink: 0 }} />
                Получить код подтверждения по SMS
              </label>
            </div>
            {error && <div className="login-error">{error}</div>}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? '...' : 'Зарегистрироваться'}
            </button>
          </form>
        )}

        {/* Верификация */}
        {mode === 'verify' && (
          <form onSubmit={onSubmitVerify} autoComplete="off">
            <p style={{ fontSize: '13px', color: '#555', marginBottom: '16px' }}>
              Код отправлен на: <strong>{values.email}</strong>
            </p>
            <div className="login-field">
              <label>Код подтверждения</label>
              <input type="text" value={code} onChange={e => { setCode(e.target.value); if (error) setError('') }} required placeholder="Введите код из письма" />
            </div>
            {error && <div className="login-error">{error}</div>}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? '...' : 'Подтвердить'}
            </button>
          </form>
        )}

        {/* Ссылки переключения */}
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#666' }}>
          {mode === 'login' && (
            <>Нет аккаунта?{' '}
              <button onClick={() => switchMode('register')} style={{ background: 'none', border: 'none', color: '#4A7FFF', cursor: 'pointer', fontSize: '13px', padding: 0 }}>
                Зарегистрироваться
              </button>
            </>
          )}
          {mode === 'register' && (
            <>Уже есть аккаунт?{' '}
              <button onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', color: '#4A7FFF', cursor: 'pointer', fontSize: '13px', padding: 0 }}>
                Войти
              </button>
            </>
          )}
          {mode === 'verify' && (
            <button onClick={() => switchMode('register')} style={{ background: 'none', border: 'none', color: '#4A7FFF', cursor: 'pointer', fontSize: '13px', padding: 0 }}>
              ← Назад
            </button>
          )}
        </div>

      </div>
    </div>
  )
}