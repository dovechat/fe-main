import { useState, useEffect } from 'react'
import { getLines, updateLine } from '../../api/lines'
import Button from './Button'

function LineList({ tenantId, onCreateClick, onLineClick }) {
  const [lines, setLines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  useEffect(() => {
    if (tenantId) {
      loadLines()
    }
  }, [tenantId])

  const loadLines = async () => {
    try {
      setLoading(true)
      const data = await getLines(tenantId)
      setLines(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeStyle = (status, daysUntilExpiry) => {
    if (status === 'expired') return { background: '#f8d7da', color: '#721c24' }
    if (status === 'disabled') return { background: '#e2e3e5', color: '#383d41' }
    if (daysUntilExpiry !== null && daysUntilExpiry <= 3) return { background: '#fff3cd', color: '#856404' }
    return { background: '#d4edda', color: '#155724' }
  }

  const getConnectionStatusStyle = (status) => {
    switch (status) {
      case 'connected': return { background: '#d4edda', color: '#155724' }
      case 'disconnected': return { background: '#f8d7da', color: '#721c24' }
      case 'connecting': return { background: '#fff3cd', color: '#856404' }
      default: return { background: '#e2e3e5', color: '#383d41' }
    }
  }

  const formatDays = (days) => {
    if (days === null) return ''
    if (days === 0) return 'сегодня'
    if (days === 1) return '1 день'
    if (days < 5) return `${days} дня`
    return `${days} дней`
  }

  if (loading) return <div className="dashboard">Загрузка линий...</div>
  if (error) return <div className="dashboard error">{error}</div>

  return (
    <div className="dashboard">
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Линии мессенджеров</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>Управление подключениями к мессенджерам</p>
        </div>
        <Button 
          variant="success" 
          onClick={onCreateClick}
          style={{ padding: '8px 16px', fontSize: '14px', maxWidth: '30%' }}
        >
          + Купить линию
        </Button>
      </div>

      {lines.length === 0 ? (
          <div style={{ 
            background: 'white', 
            padding: '60px 20px', 
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', color: '#e1e4e8' }}>📱</div>
            <h3 style={{ marginBottom: '8px' }}>Нет линий</h3>
            <p style={{ color: '#666', marginBottom: '24px' }}>Начните с создания первой линии</p>
          </div>
        ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {lines.map((line) => (
            <div
              key={line.id}
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #e1e4e8',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => onLineClick(line)}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#4A90E2'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e1e4e8'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>

{editingId === line.id ? (
  <form onSubmit={async (e) => {
    e.preventDefault()
    await updateLine(tenantId, line.id, { name: editingName })
    setEditingId(null)
    loadLines()
  }} onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '8px' }}>
    <input autoFocus value={editingName} onChange={e => setEditingName(e.target.value)} style={{ fontSize: '16px', padding: '2px 6px', borderRadius: '6px', border: '1px solid #4A90E2' }} />
    <Button type="submit" variant="success">OK</Button>
    <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>✕</Button>
  </form>
) : line.name}

                    </h3>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      ...getStatusBadgeStyle(line.status, line.days_until_expiry)
                    }}>
                      {line.status === 'active' ? 'Активна' :
                       line.status === 'disabled' ? 'Отключена' :
                       line.status === 'expired' ? 'Истекла' : line.status}
                    </span>
                    {line.is_demo && (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: '#d0ebff',
                        color: '#0c63e4'
                      }}>
                        Демо
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '24px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Тип канала</div>
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>
                        {line.channel_type === 'telegram_bot' ? 'Telegram Bot' :
                         line.channel_type === 'telegram_user' ? 'Telegram User' :
                         line.channel_type === 'whatsapp_green' ? 'WhatsApp Green API' :
                         line.channel_type === 'whatsapp_business' ? 'WhatsApp Business' :
                         line.channel_type === 'vk' ? 'VK' : line.channel_type}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Статус подключения</div>
                      <div>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          ...getConnectionStatusStyle(line.connection_status)
                        }}>
                          {line.connection_status === 'connected' ? 'Подключен' :
                           line.connection_status === 'disconnected' ? 'Отключен' :
                           line.connection_status === 'connecting' ? 'Подключается' :
                           line.connection_status === 'not_connected' ? 'Не подключен' : line.connection_status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Дата окончания</div>
                      <div style={{ fontSize: '14px' }}>
                        {line.expires_at ? new Date(line.expires_at).toLocaleDateString('ru-RU') : 'Не установлена'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Дней до окончания</div>
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>
                        {line.days_until_expiry !== null ? formatDays(line.days_until_expiry) : '∞'}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>


<Button variant="primary" onClick={(e) => {
  e.stopPropagation()
  setEditingId(line.id)
  setEditingName(line.name)
}}>
  Переименовать
</Button>


                  <Button variant="primary" onClick={(e) => {
                    e.stopPropagation()
                    onLineClick(line)
                  }}>
                    Управлять
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LineList