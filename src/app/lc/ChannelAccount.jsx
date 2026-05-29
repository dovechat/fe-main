import { useState, useEffect } from 'react'
import { getChannelAccount, updateTelegramBot, updateTelegramUser, updateVk, updateWhatsAppGreen, updateWaba } from '../../api/lines'
import Button from './Button'
import Input from './Input'
import apiClient from '../../services/accountClient'

function ChannelAccount({ tenantId, lineId, channelType, onBack }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [credentials, setCredentials] = useState({})
  const [saving, setSaving] = useState(false)

  const [showCodeInput, setShowCodeInput] = useState(false)
  const [code, setCode] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authStep, setAuthStep] = useState('idle')
  const [qrLoading, setQrLoading] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [showToken, setShowToken] = useState(false)

  const [tgQrCode, setTgQrCode] = useState(null)
  const [tgQrToken, setTgQrToken] = useState(null)
  const [tgQrLoading, setTgQrLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadAccountInfo = async () => {
      try {
        setLoading(true)

        let response
        try {
          response = await getChannelAccount(tenantId, lineId)
        } catch (err) {
          if (err.response?.status === 404) {
            console.log('Аккаунт ещё не создан (нормально)')
            initEmptyCredentials()
            return
          }
          throw err
        }

        if (!isMounted) return

        if (response) {
          const phone = response.phone || response.state_json?.phone
          if (phone) setCredentials({ phone })
          else initEmptyCredentials()
        }

      } catch (err) {
        console.error('Ошибка загрузки:', err)
        if (isMounted) initEmptyCredentials()
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadAccountInfo()

    return () => { isMounted = false }
  }, [tenantId, lineId, channelType])

  const initEmptyCredentials = () => {
    switch (channelType) {
      case 'telegram_bot':
        setCredentials({ bot_token: '', webhook_url: '' })
        break
      case 'telegram_user':
        setCredentials({ phone: '' })
        break
      case 'whatsapp_green':
        setCredentials({ idInstance: '', apiTokenInstance: '' })
        break
      case 'waba':
        setCredentials({ api_key: '' })
        break
      case 'vk':
        setCredentials({ access_token: '', group_id: '' })
        break
      default:
        setCredentials({})
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setCredentials({ ...credentials, [name]: value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    console.log('Отправляемые credentials:', credentials)
    try {
      let response
      switch (channelType) {
        case 'telegram_bot':
          response = await updateTelegramBot(tenantId, lineId, credentials)
          break
        case 'telegram_user':
          response = await updateTelegramUser(tenantId, lineId, credentials)
          break
        case 'whatsapp_green':
          response = await updateWhatsAppGreen(tenantId, lineId, credentials)
          break
        case 'waba':
          response = await updateWaba(tenantId, lineId, credentials)
          break
        case 'vk':
          response = await updateVk(tenantId, lineId, credentials)
          break
        default:
          throw new Error('Тип канала не поддерживается')
      }

      alert('Настройки сохранены! Канал подключен.')
      onBack()
    } catch (err) {
      console.error('Ошибка при сохранении:', err)
      console.error('Полная ошибка:', JSON.stringify(err, null, 2))
      setError(err.response?.data?.detail || err.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleRequestCode = async () => {
    console.log('TG API URL:', import.meta.env.VITE_TELEGRAM_API_URL)
    if (!credentials.phone) {
      setError('Введите номер телефона')
      return
    }
    try {
      setAuthLoading(true)

      const API_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/auth/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: credentials.phone })
      })
      if (!response.ok) throw new Error('Ошибка запроса кода')
      setAuthStep('code_requested')
      setShowCodeInput(true)
      alert('Код отправлен в Telegram!')
    } catch (err) {
      setError('Ошибка при запросе кода: '  + (err.response?.data?.detail || err.message))
    } finally {
      setAuthLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setError('Введите код из Telegram')
      return
    }
    try {
      setAuthLoading(true)
      const API_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000'
      const checkResponse = await fetch(
        `${API_URL}/auth/check?phone=${encodeURIComponent(credentials.phone)}&code=${code}`,
        { method: 'POST', headers: { accept: 'application/json' } }
      )
      if (!checkResponse.ok) throw new Error('Неверный код')
      const authData = await checkResponse.json()
      console.log('/auth/check authData', authData)
      if (authData.status !== 'authorized') throw new Error('Авторизация не удалась')
      await updateTelegramUser(tenantId, lineId, {
        phone: credentials.phone,
        session_string: authData.session,
      })
      setAuthStep('verified')
      alert('Аккаунт успешно авторизован!')
      onBack()
    } catch (err) {
      setError('Ошибка проверки кода: ' +  + (err.response?.data?.detail || err.message))
    } finally {
      setAuthLoading(false)
    }
  }

  const handleGetQR = async () => {
    if (!credentials.idInstance || !credentials.apiTokenInstance) {
      setError('Введите ID инстанса и API токен')
      return
    }
    try {
      setQrLoading(true)
      const response = await apiClient.post(
        `/tenants/${tenantId}/lines/${lineId}/account/whatsapp-green/qr`,
        { id_instance: credentials.idInstance, api_token: credentials.apiTokenInstance }
      )
      setQrCode(response.data.qr)
    } catch (err) {
      setError('Ошибка получения QR: ' +  + (err.response?.data?.detail || err.message))
    } finally {
      setQrLoading(false)
    }
  }

  const handleRequestTgQR = async () => {
    try {
      setTgQrLoading(true)
      const API_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/auth/qr/start`, { method: 'POST' })
      if (!response.ok) throw new Error('Ошибка получения QR')
      const data = await response.json()
      setTgQrCode(data.qr)
      setTgQrToken(data.token)
      pollTgQrStatus(data.token)
    } catch (err) {
      setError('Ошибка получения QR: ' +  + (err.response?.data?.detail || err.message))
    } finally {
      setTgQrLoading(false)
    }
  }

  const pollTgQrStatus = async (token) => {
    if (!token || token === 'undefined') {
      setError('Ошибка получения токена QR' + (err.response?.data?.detail || err.message))
      return
    }
    let attempts = 0
    const API_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000'
    const interval = setInterval(async () => {
      attempts++
      if (attempts > 5) {
        clearInterval(interval)
        setError('Время ожидания QR истекло')
        setTgQrCode(null)
        return
      }
      try {
        const response = await fetch(`${API_URL}/auth/qr/status?token=${encodeURIComponent(token)}`)
        const data = await response.json()
        if (data.status === 'authorized') {
          clearInterval(interval)
          await updateTelegramUser(tenantId, lineId, { session_string: data.session })
          alert('Аккаунт успешно авторизован!')
          onBack()
        }
      } catch (err) {
        clearInterval(interval)
        setError('Ошибка проверки QR: ' + (err.response?.data?.detail || err.message))
      }
    }, 3000)
  }

  const handleConnectInstance = async () => {
    try {
      setQrLoading(true)
      const response = await apiClient.post(
        `/tenants/${tenantId}/lines/${lineId}/account/whatsapp-green/connect`
      )
      setQrCode(response.data.qr.qr)
      await updateWhatsAppGreen(tenantId, lineId, {})
      pollGreenStatus()
    } catch (err) {
      setError('Ошибка подключения: ' + (err.response?.data?.detail || err.message))
    } finally {
      setQrLoading(false)
    }
  }

  const pollGreenStatus = () => {
    const interval = setInterval(async () => {
      try {
        const accounts = await getChannelAccount(tenantId, lineId)
        const account = Array.isArray(accounts)
          ? accounts.find(a => a.channel_type === 'whatsapp_green')
          : accounts
        if (account?.connection_status === 'connected') {
          clearInterval(interval)
          onBack()
        }
      } catch {
        clearInterval(interval)
      }
    }, 2000)
  }

  const getChannelName = () => {
    switch (channelType) {
      case 'telegram_bot':   return 'Telegram Bot'
      case 'telegram_user':  return 'Telegram User'
      case 'vk':             return 'VK'
      default:               return channelType
    }
  }

  const renderForm = () => {
    switch (channelType) {
      case 'telegram_bot':
        return (
          <>
            <Input
              label="Токен бота"
              name="bot_token"
              value={credentials.bot_token || ''}
              onChange={handleChange}
              required
              placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
            />
            <Input
              label="Webhook URL (опционально)"
              name="webhook_url"
              value={credentials.webhook_url || ''}
              onChange={handleChange}
              placeholder="https://your-domain.com/webhook"
            />
            <p className="dc-muted-xs" style={{ marginTop: '-10px', marginBottom: '20px' }}>
              Получите токен у <a href="https://t.me/BotFather" target="_blank" rel="noreferrer">@BotFather</a>
            </p>
          </>
        )

      case 'telegram_user':
        return (
          <>
            <Input
              label="Номер телефона"
              name="phone"
              value={credentials.phone || ''}
              onChange={handleChange}
              placeholder="+79991234567"
            />
            <p className="dc-muted-xs" style={{ marginTop: '-10px', marginBottom: '20px' }}>
              Номер телефона с кодом страны. На него придёт код подтверждения.
            </p>

            {!showCodeInput ? (
              <button
                type="button"
                className="dc-btn dc-btn-outline"
                onClick={handleRequestCode}
                disabled={authLoading}
                style={{ marginBottom: '16px' }}
              >
                {authLoading ? 'Отправка...' : 'Получить код из Telegram'}
              </button>
            ) : (
              <div style={{ marginTop: '16px' }}>
                <Input
                  type="text"
                  label="Код из Telegram"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Введите 5-значный код"
                  style={{ marginBottom: '12px' }}
                />
                <button
                  type="button"
                  className="dc-btn dc-btn-primary"
                  onClick={handleVerifyCode}
                  disabled={authLoading}
                >
                  {authLoading ? 'Проверка...' : 'Подтвердить код'}
                </button>
              </div>
            )}

            {!tgQrCode ? (
              <button
                type="button"
                className="dc-btn dc-btn-outline"
                onClick={async () => { await handleRequestTgQR() }}
                disabled={tgQrLoading}
                style={{ marginBottom: '16px', marginTop: '12px' }}
              >
                {tgQrLoading ? 'Генерация QR...' : 'Войти через QR код'}
              </button>
            ) : (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <img
                  src={`data:image/png;base64,${tgQrCode}`}
                  alt="Telegram QR"
                  style={{ maxWidth: '300px', marginBottom: '12px' }}
                />
                <p className="dc-muted-xs">
                  Откройте Telegram → Настройки → Устройства → Подключить устройство
                </p>
              </div>
            )}
          </>
        )

      case 'vk':
        return (
          <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
            <div style={{ width: '200px', flexShrink: 0 }}>
              <Input
                label="Access Token"
                name="access_token"
                value={credentials.access_token || ''}
                onChange={handleChange}
                required
                placeholder="vk1.a.abcdef..."
              />
              <Input
                label="ID группы (опционально)"
                name="group_id"
                value={credentials.group_id || ''}
                onChange={handleChange}
                placeholder="123456789"
              />
              <Input
                label="Код подтверждения"
                name="confirmation_code"
                value={credentials.confirmation_code || ''}
                onChange={handleChange}
                placeholder="f6ec725d"
              />
              <Input
                label="Секретный ключ"
                name="secret_key"
                value={credentials.secret_key || ''}
                onChange={handleChange}
                placeholder="Секретный ключ callback"
              />
            </div>
            <p className="dc-muted-xs" style={{ flex: 1 }}>
              Получите эти параметры в настройках приложения VK:<br />
              — главная страница VK → сообщества → ваша группа → управление → дополнительно → работа с API.<br />
              <strong>Access Token</strong> — во вкладке «Ключи доступа»<br />
              При создании ключа надо проставить галки:<br />
              Разрешить приложению доступ к сообщениям сообщества<br />
              Разрешить приложению доступ к фотографиям сообщества<br />
              Разрешить приложению доступ к документам сообщества<br />
              Остальные параметры — во вкладке Callback API:<br />
              <strong>ID группы</strong> — в сером блоке «type»: «confirmation», «group_id»: 123456789.<br />
              <strong>Код подтверждения</strong> — сразу под ним «Строка, которую должен вернуть сервер: 987654321»<br />
              <strong>Секретный ключ</strong> — придумайте сами из латинских букв и цифр и сохраните у себя.<br />
              <strong style={{ color: '#b91c1c' }}>Внимание!</strong> В форме настроек на сайте VK ничего сохранять (и нажимать кнопки) <strong>не нужно</strong>,<br />
              все параметры вводятся <strong>только</strong> в нашем интерфейсе, в этой форме.
            </p>
          </div>
        )

      case 'whatsapp_green':
        return (
          <>
            {!qrCode ? (
              <div style={{ marginBottom: '20px' }}>
                <button
                  type="button"
                  className="dc-btn dc-btn-outline"
                  onClick={handleConnectInstance}
                  disabled={qrLoading}
                >
                  {qrLoading ? 'Подключение...' : 'Подключить инстанс'}
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <img
                  src={`data:image/png;base64,${qrCode}`}
                  alt="WhatsApp QR"
                  style={{ maxWidth: '300px', marginBottom: '12px' }}
                />
                <p className="dc-muted-xs">Отсканируйте в WhatsApp → Связанные устройства</p>
              </div>
            )}
          </>
        )

      case 'waba':
        return (
          <>
            <Input
              label="API Key"
              name="api_key"
              value={credentials.api_key || ''}
              onChange={handleChange}
              required
              placeholder="ваш-360dialog-api-key"
            />
            <p className="dc-muted-xs" style={{ marginTop: '8px' }}>
              API ключ из 360dialog → настройки номера
            </p>
          </>
        )

      default:
        return (
          <p className="dc-muted" style={{ textAlign: 'center', padding: '40px' }}>
            Настройка для этого типа канала пока не реализована
          </p>
        )
    }
  }

  if (loading) {
    return (
      <div className="dc-fe-page">
        <p className="dc-muted">Загрузка настроек канала...</p>
      </div>
    )
  }

  return (
    <div className="dc-fe-page dc-fe-stack" style={{ maxWidth: channelType === 'vk' ? '860px' : '520px' }}>
      <button type="button" className="dc-btn dc-btn-outline dc-btn-sm" onClick={onBack}>
        ← Назад к линии
      </button>

      <div>
        <h1 className="dc-fe-title">Настройка канала: {getChannelName()}</h1>
        <p className="dc-muted">Введите данные для подключения к {getChannelName()}</p>
      </div>

      <div className="dc-card">
        <div className="dc-card-pad">
          <form onSubmit={handleSubmit} autoComplete="off">
            {renderForm()}

            {error && <p className="error" style={{ marginTop: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              {channelType !== 'whatsapp_green' && (
                <button type="submit" className="dc-btn dc-btn-primary" disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Сохранение...' : 'Сохранить и подключить'}
                </button>
              )}
              <button type="button" className="dc-btn dc-btn-outline" onClick={onBack} style={{ flex: 1 }}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChannelAccount