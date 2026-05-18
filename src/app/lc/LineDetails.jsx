import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MessageSquare,
  Smartphone,
  Package,
  CheckCircle,
  Trash2,
  Power,
  Plus,
  Settings,
} from 'lucide-react'
import { getLine, updateLine, deleteLine, getChannelAccount, toggleChannelConnection } from '../../api/lines'
import apiClient from '../../services/accountClient'
import { useAuth } from '../../context/AuthContext'

/* ─── helpers ─────────────────────────────────────────────── */

function channelLabel(type) {
  switch (type) {
    case 'telegram_bot':   return 'Telegram Bot'
    case 'telegram_user':  return 'Telegram'
    case 'whatsapp_green': return 'WhatsApp'
    case 'waba':           return 'WhatsApp Business'
    case 'vk':             return 'VK'
    default:               return type || 'Канал'
  }
}

function uiKind(type) {
  if (type === 'whatsapp_green') return 'whatsapp'
  if (type === 'telegram_bot' || type === 'telegram_user') return 'telegram'
  if (type === 'waba') return 'waba'
  return 'other'
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatDateFull(iso) {
  if (!iso) return 'Не установлена'
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/* ─── platform icon ───────────────────────────────────────── */

function PlatformIcon({ kind }) {
  const style = { width: '2.5rem', height: '2.5rem' }
  if (kind === 'whatsapp') {
    return (
      <div className="dc-platform-icon-wa" style={style}>
        <MessageSquare size={20} />
      </div>
    )
  }
  if (kind === 'telegram') {
    return (
      <div className="dc-platform-icon-tg" style={style}>
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.45 3.62-.52.36-.99.53-1.42.52-.47-.01-1.37-.27-2.03-.49-.82-.27-1.47-.42-1.42-.88.03-.24.37-.49 1.03-.74 4.02-1.75 6.7-2.91 8.05-3.47 3.84-1.61 4.64-1.89 5.16-1.9.11 0 .37.03.54.17.14.12.18.27.2.38.01.09.03.32.01.5z" />
        </svg>
      </div>
    )
  }
  if (kind === 'waba') {
    return (
      <div className="dc-platform-icon-waba" style={style}>
        <Smartphone size={20} />
      </div>
    )
  }
  return (
    <div className="dc-platform-icon-default" style={style}>
      <Package size={20} />
    </div>
  )
}

/* ─── status badge ────────────────────────────────────────── */

function StatusBadge({ status }) {
  if (status === 'active')   return <span className="dc-badge dc-badge-green">Активна</span>
  if (status === 'disabled') return <span className="dc-badge dc-badge-neutral">Отключена</span>
  if (status === 'expired')  return <span className="dc-badge dc-badge-red">Истекла</span>
  return <span className="dc-badge dc-badge-neutral">{status}</span>
}

/* ─── main ────────────────────────────────────────────────── */

function LineDetails({ tenantId, lineId, onBack, onDeleted }) {
  const [line, setLine] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { currentTenant } = useAuth()
  const navigate = useNavigate()

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
        if (err.response?.status !== 404) console.error('Ошибка загрузки аккаунтов:', err)
        setAccounts([])
      }
    }
    loadAccounts()
  }, [tenantId, line?.id])

  const loadLine = async () => {
    try {
      setLoading(true)
      const data = await getLine(tenantId, lineId)
      setLine(data)
      setEditName(data.name)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateName = async (e) => {
    e.preventDefault()
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

  const handleCleanup = async () => {
    if (!confirm('Очистить линию? Все каналы будут удалены.')) return
    try {
      await apiClient.post(`/tenants/${tenantId}/lines/${line.id}/account/cleanup`)
      alert('Линия очищена')
      onBack()
    } catch {
      alert('Ошибка очистки')
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

  const handleToggleConnection = async (channelType) => {
    try {
      const updated = await toggleChannelConnection(tenantId, lineId, channelType)
      setAccounts(accounts.map(a => a.channel_type === channelType ? updated : a))
    } catch (err) {
      console.error(err)
    }
  }

  const buildChannelRows = () => {
    if (!line) return []
    if (accounts.length) {
      return accounts.map((acc) => {
        const ct = acc.channel_type || line.channel_type
        return {
          type: ct,
          kind: uiKind(ct),
          label: channelLabel(ct),
          identifier: acc.phone || line.connection_state?.phone || acc.external_id || '—',
          connected: acc.connection_status === 'connected',
          expires_at: acc.expires_at,
        }
      })
    }
    const ct = line.channel_type
    return [{
      type: ct,
      kind: uiKind(ct),
      label: channelLabel(ct),
      identifier: line.connection_state?.phone || line.name || '—',
      connected: line.connection_status === 'connected',
      expires_at: null,
    }]
  }

  /* ── loading / error ── */
  if (loading) return <div className="dc-fe-page"><p className="dc-muted">Загрузка данных линии...</p></div>
  if (error)   return <div className="dc-fe-page"><p className="error">{error}</p></div>
  if (!line)   return <div className="dc-fe-page"><p className="dc-muted">Линия не найдена</p></div>

  const channelRows = buildChannelRows()
  const uniqueKinds = [...new Set(channelRows.map(c => c.kind))].filter(k => k !== 'other')

  return (
    <div className="dc-fe-page dc-fe-stack">

      {/* ── breadcrumb ── */}
      <div className="dc-line-settings-breadcrumb">
        <button type="button" onClick={onBack}>
          <ArrowLeft size={16} />
          Линии
        </button>
        <span>/</span>
        <span style={{ color: '#0f172a' }}>Настройки линии</span>
      </div>

      <h1 className="dc-fe-title">Настройки линии</h1>

      {/* ── hero ── */}
      <div className="dc-line-settings-hero">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>

          {/* название + иконки платформ + статус */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              {editing ? (
                <form onSubmit={handleUpdateName} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    autoFocus
                    className="dc-input"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    style={{ fontSize: '1rem', padding: '4px 8px', maxWidth: '220px' }}
                  />
                  <button type="submit" className="dc-btn dc-btn-primary dc-btn-sm" disabled={updating}>OK</button>
                  <button type="button" className="dc-btn dc-btn-outline dc-btn-sm" onClick={() => setEditing(false)}>✕</button>
                </form>
              ) : (
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>{line.name}</h2>
              )}
              <p className="dc-muted-xs" style={{ margin: '0.25rem 0 0' }}>
                ID: #{String(line.id).slice(0, 8)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {uniqueKinds.map(k => <PlatformIcon key={k} kind={k} />)}
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <StatusBadge status={line.status} />
              {line.is_demo && <span className="dc-badge dc-badge-amber">Демо</span>}
            </div>
          </div>

          {/* оплачено до + кнопки */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div>
              <p className="dc-muted-xs" style={{ margin: 0 }}>Оплачено до</p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '1.125rem', fontWeight: 600 }}>
                {line.expires_at ? formatDate(line.expires_at) : '—'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" className="dc-btn dc-btn-outline dc-btn-sm" onClick={() => setEditing(true)}>
                Переименовать
              </button>
              <button
                type="button"
                className="dc-btn dc-btn-sm"
                style={{ background: 'linear-gradient(90deg, #f472b6, #c084fc)', color: '#fff', border: 'none', boxShadow: '0 8px 20px rgba(192,132,252,0.35)' }}
                onClick={() => navigate(`/lc/lines/${lineId}/renew`)}
              >
                Продлить
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── основная информация ── */}
      <div className="dc-card">
        <div className="dc-card-pad">
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 600 }}>Основная информация</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <p className="dc-muted-xs" style={{ margin: '0 0 0.25rem' }}>ID линии</p>
              <code style={{ fontSize: '0.8125rem', background: '#f5f7fa', padding: '4px 8px', borderRadius: '4px', display: 'block' }}>
                {line.id}
              </code>
            </div>
            <div>
              <p className="dc-muted-xs" style={{ margin: '0 0 0.25rem' }}>Номер телефона</p>
              <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 500 }}>
                {line.connection_state?.phone || 'Не указан'}
              </p>
            </div>
            <div>
              <p className="dc-muted-xs" style={{ margin: '0 0 0.25rem' }}>Дата создания</p>
              <p style={{ margin: 0, fontSize: '0.9375rem' }}>{formatDateFull(line.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── каналы ── */}
      <div className="dc-card">
        <div className="dc-card-pad">
          <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 600 }}>Каналы</h3>
          <p className="dc-muted-xs" style={{ margin: '0 0 1rem' }}>Подключённые мессенджеры и статус</p>

          <div className="dc-platform-list">
            {channelRows.map((ch, idx) => {
              const isPast = ch.expires_at && new Date(ch.expires_at) < new Date()
              return (
                <div key={`${ch.type}-${idx}`} className="dc-platform-row">
                  <div className="dc-platform-left">
                    <PlatformIcon kind={ch.kind} />
                    <div className="dc-platform-meta">
                      <p className="dc-platform-label">{ch.label}</p>
                      <p className="dc-platform-id">{ch.identifier !== '—' ? ch.identifier : <span className="dc-muted-xs">телефон или ID</span>}</p>
                      {ch.expires_at && (
                        <p className="dc-muted-xs" style={{ margin: '0.1rem 0 0', color: isPast ? '#b91c1c' : '#6b7280' }}>
                          {isPast ? 'Истёк: ' : 'Оплачен до: '}{formatDate(ch.expires_at)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {ch.connected ? (
                      <span className="dc-badge dc-badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle size={12} />
                        Подключён
                      </span>
                    ) : (
                      <span className="dc-badge dc-badge-neutral">Не подключён</span>
                    )}
                    <button type="button" className="dc-btn dc-btn-outline dc-btn-sm" onClick={() => handleToggleConnection(ch.type)}>
                      <Power size={14} />
                      {ch.connected ? 'Отключить' : 'Переподключить'}
                    </button>
                    <button
                      type="button"
                      className="dc-btn dc-btn-outline dc-btn-sm"
                      onClick={() => navigate(`/lc/lines/${lineId}/channel/${ch.type}`)}
                    >
                      <Settings size={14} />
                      Настроить
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {accounts.length < 5 && (
            <button
              type="button"
              className="dc-btn dc-btn-outline"
              style={{ marginTop: '0.75rem' }}
              onClick={() => navigate(`/lc/lines/${lineId}/add-channel`)}
            >
              <Plus size={16} />
              Добавить канал
            </button>
          )}
        </div>
      </div>

      {/* ── действия с линией ── */}
      <div className="dc-card">
        <div className="dc-card-pad">
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 600 }}>Действия с линией</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button type="button" className="dc-btn dc-btn-outline" onClick={toggleLineStatus} disabled={updating}>
              <Power size={16} />
              {line.status === 'active' ? 'Отключить' : 'Включить'}
            </button>
            {/*
            <button type="button" className="dc-btn dc-btn-outline">
              Экспорт диалогов
            </button>
            */}
            <button type="button" className="dc-btn dc-btn-outline" onClick={handleCleanup}>
              Очистить линию
            </button>
            <button
              type="button"
              className="dc-btn"
              style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 size={16} />
              Удалить линию
            </button>
          </div>
        </div>
      </div>




      <div className="dc-card">
        <div className="dc-card-pad">
          <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 600 }}>Привязка к компании</h3>
          <p className="dc-muted-xs" style={{ margin: '0 0 0.75rem' }}>
            Линия работает в контексте текущей активной компании в консоли.
          </p>
          <label className="dc-muted-xs" style={{ display: 'block', marginBottom: '0.35rem' }}>
            Компания
          </label>
          <input
            type="text"
            readOnly
            className="dc-select"
            style={{ maxWidth: '28rem', cursor: 'default', color: '#0f172a' }}
            value={currentTenant?.name || '—'}
          />
        </div>
      </div>




    </div>
  )
}

export default LineDetails