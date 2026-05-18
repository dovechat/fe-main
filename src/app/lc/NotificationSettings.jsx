import { useState, useEffect } from 'react'
import { Plus, Trash2, Bell } from 'lucide-react'
import {
  getNotificationSettings,
  createNotificationSettings,
  updateNotificationSettings,
  deleteNotificationSettings,
} from '../../api/notifications'

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

const EMPTY_FORM = {
  notification_type: 'line_expiration',
  channel: 'email',
  target: '',
  enabled: true,
}

function NotificationSettings({ currentTenantId, onSettingsLoaded }) {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)

  useEffect(() => {
    if (currentTenantId) loadSettings()
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
      setFormData(EMPTY_FORM)
      await loadSettings()
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  const handleToggle = async (setting) => {
    try {
      await updateNotificationSettings(currentTenantId, setting.id, { enabled: !setting.enabled })
      await loadSettings()
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

  const targetPlaceholder = formData.channel === 'email'
    ? 'user@example.com'
    : formData.channel === 'telegram'
      ? '@username или 123456789'
      : '+79991234567'

  const targetLabel = formData.channel === 'email'
    ? 'Email'
    : formData.channel === 'telegram'
      ? '@username или chat_id'
      : 'Телефон'

  if (loading) return <div className="dc-fe-page"><p className="dc-muted">Загрузка настроек уведомлений...</p></div>
  if (!currentTenantId) return <div className="dc-fe-page"><p className="dc-muted">Выберите компанию</p></div>

  return (
    <div>
      <div className="dc-fe-actions">
        {/*
        <div>
          <h1 className="dc-fe-title">Уведомления</h1>
          <p className="dc-muted">Управление каналами уведомлений</p>
        </div>
        */}
        <div className="dc-fe-actions">
          <button
            className="dc-btn dc-btn-primary"
            onClick={() => { setShowCreateForm(v => !v); setFormData(EMPTY_FORM) }}
          >
            <Plus size={16} />
            {showCreateForm ? 'Отмена' : 'Добавить'}
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {/* Форма создания */}
      {showCreateForm && (
        <div className="dc-card">
          <div className="dc-card-pad">
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 600 }}>Новая настройка</h3>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="dc-muted-xs" style={{ display: 'block', marginBottom: '0.35rem' }}>Тип события</label>
                  <select
                    className="dc-select"
                    value={formData.notification_type}
                    onChange={e => setFormData({ ...formData, notification_type: e.target.value })}
                    required
                  >
                    {Object.entries(notificationTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="dc-muted-xs" style={{ display: 'block', marginBottom: '0.35rem' }}>Канал доставки</label>
                  <select
                    className="dc-select"
                    value={formData.channel}
                    onChange={e => setFormData({ ...formData, channel: e.target.value })}
                    required
                  >
                    {Object.entries(channelLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="dc-muted-xs" style={{ display: 'block', marginBottom: '0.35rem' }}>{targetLabel}</label>
                  <input
                    type="text"
                    className="dc-input"
                    value={formData.target}
                    onChange={e => setFormData({ ...formData, target: e.target.value })}
                    placeholder={targetPlaceholder}
                    required
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                />
                <span className="dc-muted-xs">Включено сразу</span>
              </label>

              <button type="submit" className="dc-btn dc-btn-primary">Создать</button>
            </form>
          </div>
        </div>
      )}

      {/* Список */}
      {settings.length === 0 ? (
        <div className="dc-card">
          <div className="dc-card-pad">
            <div className="dc-empty">
              <Bell size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p className="dc-muted">Настройки уведомлений не найдены</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="dc-card">
          <div className="dc-card-pad">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {settings.map(setting => (
                <div key={setting.id} className="dc-perm-row" style={{ alignItems: 'center' }}>
                  <div className="dc-perm-main" style={{ flex: 1 }}>
                    <p className="dc-strong" style={{ margin: '0 0 0.2rem' }}>
                      {notificationTypeLabels[setting.notification_type] || setting.notification_type}
                    </p>
                    <p className="dc-muted-xs" style={{ margin: 0 }}>
                      {channelLabels[setting.channel]} · {setting.target}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {setting.enabled
                      ? <span className="dc-badge dc-badge-green">Включено</span>
                      : <span className="dc-badge dc-badge-neutral">Выключено</span>
                    }
                    <button
                      className="dc-btn dc-btn-outline dc-btn-sm"
                      onClick={() => handleToggle(setting)}
                    >
                      {setting.enabled ? 'Выключить' : 'Включить'}
                    </button>
                    <button
                      className="dc-btn dc-btn-sm"
                      style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
                      onClick={() => handleDelete(setting.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationSettings