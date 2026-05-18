import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { getNotificationHistory } from '../../api/notifications'

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

function statusBadge(status) {
  if (status === 'sent')   return <span className="dc-badge dc-badge-green">Отправлено</span>
  if (status === 'failed') return <span className="dc-badge dc-badge-red">Ошибка</span>
  return <span className="dc-badge dc-badge-neutral">Ожидает</span>
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('ru-RU')
}

function NotificationHistory({ currentTenantId, settings = [] }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [limit] = useState(50)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (currentTenantId) loadHistory()
  }, [currentTenantId, filter, offset])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const params = { limit, offset }
      if (filter) params.notification_type = filter
      const data = await getNotificationHistory(currentTenantId, params)
      setHistory(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="dc-fe-page"><p className="dc-muted">Загрузка истории...</p></div>
  if (!currentTenantId) return <div className="dc-fe-page"><p className="dc-muted">Выберите компанию</p></div>

  return (
    <div>
      {/*
      <div className="dc-fe-header">
        <div>
          <h1 className="dc-fe-title">История уведомлений</h1>
          <p className="dc-muted">Лог отправленных и запланированных уведомлений</p>
        </div>
      </div>
      */}
      {error && <p className="error">{error}</p>}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <label className="dc-muted-xs" style={{ whiteSpace: 'nowrap' }}>Тип события</label>
        <select
          className="dc-select"
          style={{ maxWidth: '280px' }}
          value={filter}
          onChange={e => { setFilter(e.target.value); setOffset(0) }}
        >
          <option value="">Все события</option>
          {settings.map(s => (
            <option key={s.notification_type} value={s.notification_type}>
              {notificationTypeLabels[s.notification_type] || s.notification_type}
            </option>
          ))}
        </select>
      </div>

      {history.length === 0 ? (
        <div className="dc-card">
          <div className="dc-card-pad">
            <div className="dc-empty">
              <Clock size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p className="dc-muted">История уведомлений пуста</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="dc-card">
            <div className="dc-card-pad">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {history.map(item => (
                  <div key={item.id} className="dc-perm-row" style={{ alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <p className="dc-strong" style={{ margin: 0 }}>
                          {notificationTypeLabels[item.notification_type] || item.notification_type}
                        </p>
                        {statusBadge(item.status)}
                      </div>
                      {item.message && (
                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', color: '#374151' }}>{item.message}</p>
                      )}
                      <p className="dc-muted-xs" style={{ margin: 0 }}>
                        {channelLabels[item.channel]} → {item.target} · {formatDate(item.created_at)}
                      </p>
                      {item.error_message && (
                        <p className="dc-muted-xs" style={{ margin: '0.25rem 0 0', color: '#b91c1c' }}>
                          {item.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', padding: '1rem', }}>
            <button
              className="dc-btn dc-btn-outline dc-btn-sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
            >
              ← Назад
            </button>
            <button
              className="dc-btn dc-btn-outline dc-btn-sm"
              onClick={() => setOffset(offset + limit)}
              disabled={history.length < limit}
            >
              Вперёд →
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationHistory