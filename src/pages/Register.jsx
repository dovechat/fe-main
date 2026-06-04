import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register as apiRegister, verify as apiVerify, setPassword as apiSetPassword } from '../api/auth'
import AuthLayout from '../components/AuthLayout'

function useRegisterStep() {
  const { pathname } = useLocation()
  if (pathname.endsWith('/password')) return 'password'
  if (pathname.endsWith('/verify')) return 'verify'
  return 'register'
}

export default function Register() {
  const step = useRegisterStep()
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const routeState = location.state || {}

  const [values, setValues] = useState({ email: '', phone: '+', ifsms: false })
  const [passwords, setPasswords] = useState({ password: '', confirm: '' })
  const [code, setCode] = useState('')
  const [tempToken, setTempToken] = useState(routeState.tempToken ?? null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const activeToken = tempToken || routeState.tempToken
  const activeEmail = values.email || routeState.email || ''

  useEffect(() => {
    if (step === 'register') return
    if (routeState.email) {
      setValues((prev) => ({ ...prev, email: routeState.email }))
    }
    if (routeState.tempToken) setTempToken(routeState.tempToken)
    if (!routeState.tempToken) {
      navigate('/register', { replace: true })
    }
  }, [step, routeState.email, routeState.tempToken, navigate])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (error) setError('')
  }

  const handlePasswordChange = (e) => {
    setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const onSubmitRegister = async (e) => {
    e.preventDefault()
    const digits = values.phone.replace(/\D/g, '')
    if (digits.length < 9) {
      setError('Телефон должен содержать минимум 9 цифр')
      return
    }
    setLoading(true)
    try {
      const data = await apiRegister(values.email, values.phone, values.ifsms)
      navigate('/register/verify', {
        state: { email: values.email, tempToken: data.access_token },
      })
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
      await apiVerify(activeToken, code)
      navigate('/register/password', {
        state: { email: activeEmail, tempToken: activeToken },
      })
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Неверный код')
    } finally {
      setLoading(false)
    }
  }

  const onSubmitSetPassword = async (e) => {
    e.preventDefault()
    if (passwords.password !== passwords.confirm) {
      setError('Пароли не совпадают')
      return
    }
    if (passwords.password.length < 8) {
      setError('Пароль минимум 8 символов')
      return
    }
    setLoading(true)
    try {
      await apiSetPassword(activeToken, passwords.password)
      await login(activeEmail, passwords.password)
      navigate('/chats')
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Ошибка установки пароля')
    } finally {
      setLoading(false)
    }
  }

  const loginLink = (
    <>
      Уже есть аккаунт? <Link to="/login" className="login-footer-link">Войти</Link>
    </>
  )

  if (step === 'verify') {
    return (
      <AuthLayout
        title="Подтверждение email"
        footer={<Link to="/register" className="login-footer-link">← Назад</Link>}
      >
        <form onSubmit={onSubmitVerify} autoComplete="off">
          <p className="login-hint">
            Код отправлен на: <strong>{activeEmail}</strong>
          </p>
          <div className="login-field">
            <label>Код подтверждения</label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                if (error) setError('')
              }}
              required
              placeholder="Введите код из письма"
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '...' : 'Подтвердить'}
          </button>
        </form>
      </AuthLayout>
    )
  }

  if (step === 'password') {
    return (
      <AuthLayout title="Установка пароля" footer={loginLink}>
        <form onSubmit={onSubmitSetPassword} autoComplete="off">
          <div className="login-field">
            <label>Пароль</label>
            <input
              type="password"
              name="password"
              value={passwords.password}
              onChange={handlePasswordChange}
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <div className="login-field">
            <label>Подтверждение пароля</label>
            <input
              type="password"
              name="confirm"
              value={passwords.confirm}
              onChange={handlePasswordChange}
              required
              autoComplete="new-password"
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '...' : 'Сохранить и войти'}
          </button>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Регистрация" footer={loginLink}>
      <form onSubmit={onSubmitRegister} autoComplete="off">
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
          <label>Телефон</label>
          <input
            type="tel"
            name="phone"
            value={values.phone}
            onChange={handleChange}
            required
            placeholder="+79991234567"
          />
        </div>
        <div className="login-field">
          <label className="login-checkbox-label">
            <input type="checkbox" name="ifsms" checked={values.ifsms} onChange={handleChange} />
            Получить код подтверждения по SMS
          </label>
        </div>
        {error && <div className="login-error">{error}</div>}
        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? '...' : 'Зарегистрироваться'}
        </button>
      </form>
    </AuthLayout>
  )
}
