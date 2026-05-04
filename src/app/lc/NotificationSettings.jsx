import { useState, useEffect } from 'react'
import { 
  getNotificationSettings, 
  createNotificationSettings,
  updateNotificationSettings,
  deleteNotificationSettings 
} from '../../api/notifications'

function NotificationSettings({ currentTenantId, onSettingsLoaded }) {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    notification_type: 'line_expiration',
    channel: 'email',
    target: '',
    enabled: true,
  })

  useEffect(() => {
    if (currentTenantId) {
      loadSettings()
    }
  }, [currentTenantId])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await getNotificationSettings(currentTenantId)
      setSettings(data)
      onSettingsLoaded?.(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createNotificationSettings(currentTenantId, formData)
      setShowCreateForm(false)
      resetForm()
      await loadSettings()
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  const handleUpdate = async (settingsId, updates) => {
    try {
      await updateNotificationSettings(currentTenantId, settingsId, updates)
      await loadSettings()
      setEditingId(null)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  const handleDelete = async (settingsId) => {
    if (!confirm('Удалить эту настройку уведомлений?')) return
    
    try {
      await deleteNotificationSettings(currentTenantId, settingsId)
      await loadSettings()
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      notification_type: 'line_expiration',
      channel: 'email',
      target: '',
      enabled: true,
    })
  }

  const notificationTypeLabels = {
    line_expiration: 'Окончание срока линии',
    line_connection_error: 'Ошибка подключения',
    line_blocked: 'Блокировка линии',
    low_balance: 'Низкий баланс',
    payment_success: 'Успешная оплата',
  }

  const channelLabels = {
    email: 'Email',
    telegram: 'Telegram',
    sms: 'SMS',
    internal: 'Внутренние',
  }

  if (loading) return <div className="dashboard">Загрузка настроек уведомлений...</div>
  if (error) return <div className="dashboard error">{error}</div>
  if (!currentTenantId) return <div className="dashboard">Выберите компанию</div>

  return (
    <div className="dashboard">
      <h2>Настройки уведомлений</h2>
      
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p>Управление каналами уведомлений</p>
        <button className="btn btn-success" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Отмена' : '+ Добавить настройку'}
        </button>
      </div>

      {showCreateForm && (
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          border: '1px solid #e1e4e8',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0 }}>Новая настройка уведомлений</h3>
          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Тип события</label>
              <select
                value={formData.notification_type}
                onChange={(e) => setFormData({ ...formData, notification_type: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                required
              >
                {Object.entries(notificationTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Канал доставки</label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                required
              >
                {Object.entries(channelLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Адрес ({formData.channel === 'email' ? 'email' : formData.channel === 'telegram' ? '@username или chat_id' : 'телефон'})
              </label>
              <input
                type="text"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                placeholder={
                  formData.channel === 'email' ? 'user@example.com' : 
                  formData.channel === 'telegram' ? '@username или 123456789' : 
                  '+79991234567'
                }
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                required
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                Включено
              </label>
            </div>

            <button type="submit" className="btn btn-success">Создать</button>
          </form>
        </div>
      )}

      {settings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Настройки уведомлений не найдены
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {settings.map((setting) => (
            <div
              key={setting.id}
              style={{
                background: 'white',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e1e4e8',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0' }}>
                    {notificationTypeLabels[setting.notification_type] || setting.notification_type}
                  </h4>
                  <p style={{ margin: '0', color: '#666', fontSize: '13px' }}>
                    Канал: {channelLabels[setting.channel]} • 
                    Адрес: {setting.target} • 
                    Статус: {setting.enabled ? '✅ Включено' : '❌ Выключено'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className={setting.enabled ? 'btn btn-secondary' : 'btn btn-success'} onClick={() => handleUpdate(setting.id, { enabled: !setting.enabled })}>
                    {setting.enabled ? 'Выключить' : 'Включить'}
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(setting.id)}>Удалить</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationSettings