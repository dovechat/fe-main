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


  // Загружаем существующие настройки
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
    setCredentials({
      ...credentials,
      [name]: value
    })
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
  if (!credentials.phone) {
    setError('Введите номер телефона')
    return
  }

  try {
    setAuthLoading(true)
    const API_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

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
    setError('Ошибка при запросе кода: ' + err.message)
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
  
    const API_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

    const checkResponse = await fetch(`${API_URL}/auth/check?phone=${encodeURIComponent(credentials.phone)}&code=${code}`,
      { method: 'POST', headers: { 'accept': 'application/json' } }
    )

    if (!checkResponse.ok) throw new Error('Неверный код')
    
    const authData = await checkResponse.json()
    
    console.log("/auth/check authData", authData);

    if (authData.status !== 'authorized') {
      throw new Error('Авторизация не удалась')
    }

    const sessionData = {
      phone: credentials.phone,
      session_string: authData.session
    }

    await updateTelegramUser(tenantId, lineId, sessionData)
    
    setAuthStep('verified')
    alert('Аккаунт успешно авторизован!')
    onBack()
  } catch (err) {
    setError('Ошибка проверки кода: ' + err.message)
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
      `/api/v1/tenants/${tenantId}/lines/${lineId}/account/whatsapp-green/qr`,
      {
        id_instance: credentials.idInstance,
        api_token: credentials.apiTokenInstance
      }
    )
    setQrCode(response.data.qr)
  } catch (err) {
    setError('Ошибка получения QR: ' + err.message + ' ' + response.data.qr)
  } finally {
    setQrLoading(false)
  }
}



const handleRequestTgQR = async () => {
  try {
    setTgQrLoading(true)
    const API_URL =
      import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000'
    const response = await fetch(`${API_URL}/auth/qr/start`, {
      method: 'POST'
    })
    if (!response.ok) throw new Error('Ошибка получения QR')
    const data = await response.json()
    setTgQrCode(data.qr)
    setTgQrToken(data.token)
    pollTgQrStatus(data.token)
  } catch (err) {
    setError('Ошибка получения QR: ' + err.message)
  } finally {
    setTgQrLoading(false)
  }
}

const pollTgQrStatus = async (token) => {
  if (!token || token === 'undefined') {
    setError('Ошибка получения токена QR')
    return
  }
  let attempts = 0
  const API_URL =
    import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000'
  const interval = setInterval(async () => {
    attempts++
    try {
      const response = await fetch(
        `${API_URL}/auth/qr/status?token=${encodeURIComponent(token)}`
      )
      const data = await response.json()
      if (data.status === 'authorized') {
        clearInterval(interval)
        const sessionData = {
          session_string: data.session
        }
        await updateTelegramUser(tenantId, lineId, sessionData)
        alert('Аккаунт успешно авторизован!')
        onBack()
        return
      }
      if (attempts > 15) {
        clearInterval(interval)
        setTgQrCode(null)
        setTgQrToken(null)
        handleRequestTgQR()  // восстановил старое имя
        return
      }
    } catch (err) {
      clearInterval(interval)
      setError('Ошибка проверки QR: ' + err.message)
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
    setTimeout(() => pollGreenStatus(), 5000)
  } catch (err) {
    setError('Ошибка подключения: ' + err.message)
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
            <div style={{ fontSize: '13px', color: '#666', marginTop: '-10px', marginBottom: '20px' }}>
              Получите токен у <a href="https://t.me/BotFather" target="_blank" rel="noreferrer">@BotFather</a>
            </div>
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
              //required
              placeholder="+79991234567"
            />
            <div style={{ fontSize: '13px', color: '#666', marginTop: '-10px', marginBottom: '20px' }}>
              Номер телефона с кодом страны. На него придет код подтверждения.
            </div>


            {!showCodeInput ? (
              <Button 
                type="button" 
                variant="secondary"
                onClick={handleRequestCode}
                loading={authLoading}
                style={{ marginBottom: '16px' }}
              >
                Получить код из Telegram
              </Button>
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
                <Button 
                  type="button" 
                  variant="success"
                  onClick={handleVerifyCode}
                  loading={authLoading}
                >
                  Подтвердить код
                </Button>
              </div>
            )}






            {!tgQrCode ? (
              <Button
                type="button"
                variant="secondary"
                onClick={async () => { await handleRequestTgQR(); }}
                loading={tgQrLoading}
                style={{ marginBottom: '16px' }}
              >
                Войти через QR код
              </Button>
            ) : (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <img
                  src={`data:image/png;base64,${tgQrCode}`}
                  alt="Telegram QR"
                  style={{ maxWidth: '300px', marginBottom: '12px' }}
                />
                <p style={{ fontSize: '14px', color: '#666' }}>
                  Откройте Telegram → Настройки → Устройства → Подключить устройство
                </p>
              </div>
            )}



          </>
        )
      
case 'vk':
  return (
    <div  style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
      <div  style={{ width: '200px', flexShrink: 0 }}>
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

      <div style={{ flex: 1, fontSize: '13px', color: '#666' }}>
        Получите эти параметры в настройках приложения VK: <br />
        - главная страница VK - сообщества - ваша группа - управление - дополнительно - работа с API.<br />
        <b>Access Token</b> - во вкладке "Ключи доступа"<br />
        остальные параметры - во вкладке Callback API:<br />
        <b>ID группы</b> - в сером блоке с текстом "Для получения ..." "type": "confirmation", "group_id": 123456789.<br />
        <b> Код подтверждения</b>  - сразу под ним "Строка, которую должен вернуть сервер: 987654321"<br />
        <b> Секретный ключ</b>  придумайте сами, сохраните его у себя "Сохранить".<br />
        <b style={{color: "red"}}> Внимание!</b>  В форме на настроек на сайте VK ничего сохранять (и нажимать кнопки) <b>не нужно</b>, <br />
        все параметры вводятся <b>только</b> в нашем интерфейсе, в этой форме.
      </div>
    </div>
  )
      
      case 'whatsapp_green':
        return (
          <>
            {!qrCode ? (
              <div style={{ marginBottom: '20px' }}>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={handleConnectInstance}
                  loading={qrLoading}
                >
                  Подключить инстанс
              </Button>
              </div>
            ) : (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <img 
                  src={`data:image/png;base64,${qrCode}`}
                  alt="WhatsApp QR"
                  style={{ maxWidth: '300px', marginBottom: '12px' }}
                />
                <p style={{ fontSize: '14px', color: '#666' }}>
                  Отсканируйте в WhatsApp → Связанные устройства
                </p>
              </div>
            )}
          </>
        );



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
            <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
              API ключ из 360dialog → настройки номера
            </div>
          </>
        );


      default:
        return (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Настройка для этого типа канала пока не реализована
          </div>
        )
    }
  }

  const getChannelName = () => {
    switch (channelType) {
      case 'telegram_bot': return 'Telegram Bot'
      case 'telegram_user': return 'Telegram User'
      case 'vk': return 'VK'
      default: return channelType
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: '500px', margin: '40px auto' }}>
        <div>Загрузка настроек канала...</div>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: channelType === 'vk' ? '1000px' : '500px', margin: '40px auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Button variant="secondary" onClick={onBack} style={{ marginBottom: '16px' }}>
          ← Назад к линии
        </Button>
        
        <h2>Настройка канала: {getChannelName()}</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Введите данные для подключения к {getChannelName()}
        </p>
      </div>

      <form onSubmit={handleSubmit} autoComplete="off">
        {renderForm()}
        
        {error && <div className="error">{error}</div>}

      <div style={{ display: 'flex', gap: '12px', height: '40px', width: '100%', alignItems: 'stretch' }}>
        {channelType !== 'whatsapp_green' && (
          <Button type="submit" variant="success" loading={saving} 
            style={{ 
              flex: 1, 
              height: '40px', 
              padding: '0', 
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 0,
              margin: 0
            }}>
            Сохранить и подключить
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={onBack} 
          style={{ 
            flex: 1, 
            height: '40px', 
            padding: '0', 
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 0,
            margin: 0
          }}>
          Отмена
        </Button>
      </div>
      </form>
    </div>
  )
}

export default ChannelAccount