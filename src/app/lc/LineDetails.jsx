import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLine, updateLine, deleteLine, getChannelAccount, addChannel, renewChannel, toggleChannelConnection } from '../../api/lines'
import Button from './Button'
import Input from './Input'
import ChannelAccount from './ChannelAccount'
import CreateLine from './CreateLine'
import apiClient from '../../services/accountClient';


function LineDetails({ tenantId, lineId, onBack, onDeleted }) {
  const [line, setLine] = useState(null)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [accounts, setAccounts] = useState([])

  useEffect(() => {
    loadLine()
  }, [tenantId, lineId])

  useEffect(() => {
    const loadAccounts = async () => {
      if (!line?.id || !tenantId) return
      try {
        const data = await getChannelAccount(tenantId, line.id)
        const arr = Array.isArray(data) ? data : [data]
        setAccounts(arr.sort((a, b) => a.channel_type.localeCompare(b.channel_type)))
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Ошибка загрузки аккаунтов:', err)
        }
        setAccounts([])
      }
    }
    loadAccounts()
  }, [tenantId, line?.id])


  const handleCleanup = async () => {
    if (!confirm('Очистить линию? Все каналы будут удалены.')) return;
    try {
      await apiClient.post(`/tenants/${tenantId}/lines/${line.id}/account/cleanup`);
      alert('Линия очищена');
      onBack();
    } catch {
      alert('Ошибка очистки');
    }
  };

  const PROVIDERS = [
    { type: 'telegram_user', label: 'Telegram User', icon: '👤' },
    { type: 'telegram_bot', label: 'Telegram Bot', icon: '🤖' },
    { type: 'whatsapp_green', label: 'WhatsApp Green', icon: '📱' },
    { type: 'waba', label: 'WABA', icon: '💼' },
    { type: 'vk', label: 'VK', icon: '👥' },
  ]

  const getConnectionStatusStyle = (status) => {
    switch (status) {
      case 'connected': return { background: '#d4edda', color: '#155724' }
      case 'error': return { background: '#f8d7da', color: '#721c24' }
      default: return { background: '#e2e3e5', color: '#383d41' }
    }
  }


  const loadLine = async () => {
    try {
      setLoading(true)
      const data = await getLine(tenantId, lineId)
      console.log('>>> line.connection_state из API:', data.connection_state, typeof data.connection_state)
      setLine(data)
      setEditName(data.name)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateName = async () => {
    if (!editName.trim()) return
    
    try {
      setUpdating(true)
      await updateLine(tenantId, lineId, { name: editName })
      setLine({ ...line, name: editName })
      setEditing(false)
      alert('Название обновлено!')
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить эту линию?')) return
    
    try {
      setDeleting(true)
      await deleteLine(tenantId, lineId)
      alert('Линия удалена!')
      onDeleted()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Не установлена'
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'active': return { background: '#d4edda', color: '#155724' }
      case 'disabled': return { background: '#e2e3e5', color: '#383d41' }
      case 'expired': return { background: '#f8d7da', color: '#721c24' }
      default: return { background: '#e2e3e5', color: '#383d41' }
    }
  }

  const getChannelTypeLabel = (type) => {
    switch (type) {
      case 'telegram_bot': return 'Telegram Bot'
      case 'telegram_user': return 'Telegram User'
      case 'whatsapp_green': return 'WhatsApp Green'
      case 'whatsapp_business': return 'WhatsApp Business'
      default: return type
    }
  }

  const getChannelIcon = (type) => {
    switch (type) {
      case 'telegram_bot': return '🤖'
      case 'telegram_user': return '👤'
      case 'whatsapp_green': return '📱'
      case 'whatsapp_business': return '💼'
      default: return '📞'
    }
  }


  const toggleLineStatus = async () => {
    const newStatus = line.status === 'active' ? 'disabled' : 'active'
    try {
      setUpdating(true)
      await updateLine(tenantId, lineId, { status: newStatus })
      setLine({ ...line, status: newStatus })
      alert(`Линия ${newStatus === 'active' ? 'включена' : 'отключена'}!`)
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdating(false)
    }
  }




const handleConnectionToggle = async () => {
  let isConnected = false
  
  // DEBUG: что реально лежит в connection_state
  console.log('>>> typeof line.connection_state:', typeof line.connection_state)
  console.log('>>> line.connection_state:', line.connection_state)
  
  if (line.connection_state) {
    if (typeof line.connection_state === 'object' && line.connection_state.status === 'connected') {
      isConnected = true
    }
  }
  
  const newStatus = isConnected ? 'disconnected' : 'connected'
  const payload = { connection_state: { status: newStatus } }
  
  console.log('>>> Отправляем:', payload)
  
  try {
    setUpdating(true)
    await updateLine(tenantId, lineId, payload)
    setLine({ ...line, connection_state: { status: newStatus } })
    alert('Состояние обновлено!')
  } catch (err) {
    console.error('>>> Ошибка:', err.response?.data)
  } finally {
    setUpdating(false)
  }
}


const handleToggleConnection = async (channelType) => {
  try {
    const updated = await toggleChannelConnection(tenantId, lineId, channelType)
    setAccounts(accounts.map(a => a.channel_type === channelType ? updated : a))
  } catch (err) {
    console.error(err)
  }
}


  if (loading) return <div className="dashboard">Загрузка данных линии...</div>
  if (error) return <div className="dashboard error">{error}</div>
  if (!line) return <div className="dashboard">Линия не найдена</div>


  return (
    <div className="dashboard">
      <div style={{ marginBottom: '20px' }}>
        <Button variant="secondary" onClick={onBack} style={{ marginBottom: '16px' }}>
          ← Назад к списку
        </Button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>{getChannelIcon(line.channel_type)}</span>
              {editing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ width: '300px', margin: 0 }}
                  />
                  <Button variant="primary" onClick={handleUpdateName} loading={updating} size="small">
                    Сохранить
                  </Button>
                  <Button variant="secondary" onClick={() => setEditing(false)} size="small">
                    Отмена
                  </Button>
                </div>
              ) : (
                <h2>{line.name}</h2>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: '600',
                ...getStatusBadgeStyle(line.status)
              }}>
                {line.status === 'active' ? 'Активна' :
                 line.status === 'disabled' ? 'Отключена' :
                 line.status === 'expired' ? 'Истекла' : line.status}
              </span>
              {line.is_demo && (
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: '#d0ebff',
                  color: '#0c63e4'
                }}>
                  Демо
                </span>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="primary" onClick={() => setEditing(true)}>
              Переименовать
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Удалить
            </Button>
          </div>
        </div>
      </div>

      {/* Основная информация */}
      <div style={{ 
        background: 'white', 
        padding: '24px', 
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '16px', marginBottom: '20px', borderBottom: '1px solid #e1e4e8', paddingBottom: '8px' }}>
          Основная информация
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>ID линии</div>
            <div style={{ fontSize: '13px', fontFamily: 'monospace', background: '#f5f7fa', padding: '4px 8px', borderRadius: '4px' }}>
              {line.id}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Номер телефона</div>
            <div style={{ fontSize: '15px', fontWeight: '500' }}>
              {line.connection_state?.phone || 'Не указан'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Дата создания</div>
            <div style={{ fontSize: '15px' }}>{formatDate(line.created_at)}</div>
          </div>
        </div>
      </div>

      {/* Состояние подключения */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '16px', marginBottom: '20px', borderBottom: '1px solid #e1e4e8', paddingBottom: '8px' }}>
          Каналы
        </h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {accounts.map(account => (
            <div key={account.id} style={{
              border: '1px solid #e1e4e8',
              borderRadius: '12px',
              padding: '16px',
              minWidth: '200px',
              flex: '1'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '20px' }}>
                  {PROVIDERS.find(p => p.type === account.channel_type)?.icon}
                </span>
                <span style={{ fontWeight: '600' }}>
                  {PROVIDERS.find(p => p.type === account.channel_type)?.label}
                </span>
              </div>
              <div style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                marginBottom: '12px',
                ...getConnectionStatusStyle(account.connection_status)
              }}>
                {account.connection_status === 'connected' ? 'Подключён' :
                 account.connection_status === 'error' ? 'Ошибка' : 'Отключён'}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                      {(() => {
                        if (!account.expires_at) return 'Срок не указан'
                        const date = new Date(account.expires_at)
                        const isPast = date < new Date()
                        return (
                          <span style={{ color: isPast ? '#721c24' : 'inherit' }}>
                            {isPast ? 'Истёк: ' : 'Оплачен до: '}
                            {date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                        )
                      })()}
                    </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Button variant="primary" size="small"
                  onClick={() => handleToggleConnection(account.channel_type)}>
                  {account.connection_status === 'connected' ? 'Отключить' : 'Переподключить'}
                </Button>
                <Button variant="secondary" size="small"
                  onClick={() => navigate(`/lc/lines/${lineId}/channel/${account.channel_type}`)}>
                  Настроить канал
                </Button>
              </div>
            </div>
          ))}


          {accounts.length < 4 && (
              <div
              onClick={() => navigate(`/lc/lines/${lineId}/add-channel`)}
              style={{
                border: '2px dashed #4A90E2',
                borderRadius: '12px',
                padding: '12px 20px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                color: '#4A90E2',
                transition: 'background 0.2s',
                alignSelf: 'flex-start',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: '22px', lineHeight: 1 }}>+</span>
              <span style={{ fontSize: '12px' }}>Добавить канал</span>
            </div>
          )}



        </div>
      </div>

      {/* Действия с линией */}
      <div style={{ 
        background: 'white', 
        padding: '24px', 
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: '16px', marginBottom: '20px', borderBottom: '1px solid #e1e4e8', paddingBottom: '8px' }}>
          Действия с линией
        </h3>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {[
            <Button variant="primary" onClick={() => navigate(`/lc/lines/${lineId}/renew`)}>Продлить подписку</Button>,
            <Button variant={line.status === 'active' ? 'secondary' : 'success'} onClick={toggleLineStatus} loading={updating}>
              {line.status === 'active' ? 'Отключить' : 'Включить'}
            </Button>,
            <Button variant="secondary">Экспорт диалогов</Button>,
            <Button variant="danger" onClick={handleCleanup}>Очистить линию</Button>,
          ].map((btn, i) => (
            <div key={i} style={{ display: 'inline-block' }}>{btn}</div>
          ))}
        </div>


      </div>
    </div>
  )
}

export default LineDetails