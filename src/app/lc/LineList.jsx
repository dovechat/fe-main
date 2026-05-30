import { useState, useEffect } from 'react'
import { getLines, getChannelAccount, updateLine } from '../../api/lines'
import {
  MessageSquare,
  Plus,
  Settings,
  Sparkles,
  CheckCircle,
} from 'lucide-react'
import ChannelIcon from '../../components/ChannelIcon'
import { channelLabel } from '../../utils/channelIcons'

/* ─── helpers ─────────────────────────────────────────────── */

function normalizeAccounts(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw.channels)) return raw.channels
  return [raw]
}

function uiKind(type) {
  if (type === 'whatsapp_green') return 'whatsapp'
  if (type === 'telegram_bot' || type === 'telegram_user') return 'telegram'
  if (type === 'waba') return 'waba'
  return 'other'
}

function formatRelative(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'только что'
  if (m < 60) return `${m} мин. назад`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ч. назад`
  const days = Math.floor(h / 24)
  if (days === 1) return 'вчера'
  return `${days} дн. назад`
}

function buildPlatforms(line, rawAccounts) {
  const accs = normalizeAccounts(rawAccounts).filter(Boolean)
  const phone = line.connection_state?.phone
  if (!accs.length) {
    const st =
      line.connection_status === 'connected'
        ? 'connected'
        : line.connection_status === 'connecting'
          ? 'pending'
          : 'disconnected'
    return [
      {
        type: line.channel_type,
        kind: uiKind(line.channel_type),
        label: channelLabel(line.channel_type),
        identifier: phone || line.name || '—',
        status: st,
        messages: 0,
      },
    ]
  }
  return accs.map((acc) => {
    const ct = acc.channel_type || line.channel_type
    const st = acc.connection_status || line.connection_status || 'disconnected'
    const mapped =
      st === 'connected' ? 'connected' : st === 'connecting' || st === 'pending' ? 'pending' : 'disconnected'
    return {
      type: ct,
      kind: uiKind(ct),
      label: channelLabel(ct),
      identifier: acc.phone || acc.external_id || acc.identifier || phone || ct,
      status: mapped,
      messages: acc.message_count ?? 0,
    }
  })
}

/* ─── sub-components ──────────────────────────────────────── */

function StatusBadge({ status }) {
  if (status === 'connected') {
    return (
      <span className="dc-badge dc-badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
        <CheckCircle size={12} />
        Подключён
      </span>
    )
  }
  if (status === 'pending') {
    return <span className="dc-badge dc-badge-amber">Ожидание</span>
  }
  return <span className="dc-badge dc-badge-red">Отключён</span>
}

/* ─── main ────────────────────────────────────────────────── */

function LineList({ tenantId, companyName, onCreateClick, onLineClick }) {
  const [lines, setLines] = useState([])
  const [accountsByLineId, setAccountsByLineId] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [togglingId, setTogglingId] = useState(null)

  /* inline rename state */
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  useEffect(() => {
    if (tenantId) loadLines()
  }, [tenantId])

  /* load channel accounts after lines are fetched */
  useEffect(() => {
    if (!tenantId || !lines.length) {
      setAccountsByLineId({})
      return
    }
    let cancelled = false
    ;(async () => {
      const map = {}
      await Promise.all(
        lines.map(async (line) => {
          try {
            const data = await getChannelAccount(tenantId, line.id)
            if (!cancelled) map[line.id] = data
          } catch {
            if (!cancelled) map[line.id] = null
          }
        }),
      )
      if (!cancelled) setAccountsByLineId(map)
    })()
    return () => { cancelled = true }
  }, [tenantId, lines])

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

  const handleToggleEnabled = async (e, line) => {
    e.stopPropagation()
    const next = line.status === 'active' ? 'disabled' : 'active'
    try {
      setTogglingId(line.id)
      await updateLine(tenantId, line.id, { status: next })
      await loadLines()
    } catch (err) {
      setError(err.message)
    } finally {
      setTogglingId(null)
    }
  }

  const handleRename = async (e, lineId) => {
    e.preventDefault()
    await updateLine(tenantId, lineId, { name: editingName })
    setEditingId(null)
    loadLines()
  }

  if (loading) {
    return (
      <div className="dc-fe-page">
        <p className="dc-muted">Загрузка линий...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dc-fe-page">
        <div className="error">{error}</div>
      </div>
    )
  }

  const activeCount = lines.filter((l) => l.status === 'active').length
  const companyBadge = companyName || 'Компания'

  return (
    <div className="dc-fe-page dc-fe-stack">

      {/* ── шапка ── */}
      <div className="dc-fe-header">
        <div>
          <h1 className="dc-fe-title">Линии мессенджеров</h1>
          <p className="dc-fe-subtitle">Подключённые каналы и активность по текущей компании</p>
        </div>
        <div className="dc-fe-actions">
          <button
            type="button"
            className="dc-btn dc-btn-outline"
            onClick={() => window.alert('Демо-режим: для теста всех каналов используйте покупку линии или обратитесь к администратору.')}
          >
            <Sparkles size={18} />
            Демо-линия
          </button>
          <button type="button" className="dc-btn dc-btn-primary" onClick={onCreateClick}>
            <Plus size={18} />
            Добавить линию
          </button>
        </div>
      </div>

      {/* ── счётчик ── */}
      <div className="dc-stat-card">
        <div className="dc-stat-inner">
          <div className="dc-stat-row">
            <div>
              <p className="dc-muted-xs" style={{ margin: 0 }}>Активных линий</p>
              <p className="dc-stat-value">{activeCount}</p>
            </div>
            <div className="dc-icon-tile">
              <MessageSquare size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* ── пустой стейт ── */}
      {lines.length === 0 ? (
        <div className="dc-card dc-empty">
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📱</div>
          <p className="dc-strong" style={{ marginBottom: '0.35rem' }}>Нет линий</p>
          <p className="dc-muted" style={{ marginBottom: '1rem' }}>Создайте первую линию для подключения мессенджеров</p>
          <button type="button" className="dc-btn dc-btn-primary" onClick={onCreateClick}>
            <Plus size={18} />
            Добавить линию
          </button>
        </div>
      ) : (

        /* ── список линий ── */
        <div className="dc-fe-stack">
          {lines.map((line) => {
            const platforms = buildPlatforms(line, accountsByLineId[line.id])
            const enabled = line.status === 'active'

            return (
              <div key={line.id} className="dc-card dc-card-pad">

                {/* ── голова карточки ── */}
                <div className="dc-line-card-head">
                  <div style={{ flex: 1, minWidth: 0 }}>

                    {/* название + бейджи */}
                    <div className="dc-line-title-row">
                      {editingId === line.id ? (
                        <form
                          onSubmit={(e) => handleRename(e, line.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                        >
                          <input
                            autoFocus
                            className="dc-input"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            style={{ fontSize: '0.95rem', padding: '2px 8px', maxWidth: '200px' }}
                          />
                          <button type="submit" className="dc-btn dc-btn-primary dc-btn-sm">OK</button>
                          <button type="button" className="dc-btn dc-btn-outline dc-btn-sm" onClick={() => setEditingId(null)}>✕</button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          className="dc-line-name"
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                          onClick={() => onLineClick(line)}
                        >
                          {line.name}
                        </button>
                      )}

                      <span className="dc-badge">{companyBadge}</span>
                      {line.is_demo && <span className="dc-badge dc-badge-amber">Демо</span>}
                    </div>

                    <p className="dc-muted-xs" style={{ margin: 0 }}>
                      Последняя активность: {formatRelative(line.created_at)}
                    </p>
                  </div>

                  {/* действия */}
                  <div
                    className="dc-line-actions"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    role="presentation"
                  >
                    <label className="dc-switch" title={enabled ? 'Линия активна' : 'Линия отключена'}>
                      <input
                        type="checkbox"
                        checked={enabled}
                        disabled={togglingId === line.id}
                        onChange={(e) => handleToggleEnabled(e, line)}
                      />
                      <span className="dc-switch-slider" />
                    </label>

                    <button
                      type="button"
                      className="dc-btn-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingId(line.id)
                        setEditingName(line.name)
                      }}
                    >
                      Переименовать
                    </button>

                    <button
                      type="button"
                      className="dc-btn-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onLineClick(line)
                      }}
                    >
                      <Settings size={14} />
                      <span className="dc-hide-sm">Настроить</span>
                    </button>
                  </div>
                </div>

                {/* ── платформы ── */}
                <div className="dc-platform-list">
                  {platforms.map((p, idx) => (
                    <div key={`${line.id}-${idx}`} className="dc-platform-row">
                      <div className="dc-platform-left">
                        <ChannelIcon channelType={p.type} size={32} />
                        <div className="dc-platform-meta">
                          <p className="dc-platform-label">{p.label}</p>
                          <p className="dc-platform-id">{p.identifier}</p>
                        </div>
                      </div>
                      <div className="dc-platform-right">
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                          {p.messages}{' '}
                          <span className="dc-hide-sm" style={{ fontWeight: 400, color: '#6b7280' }}>сообщ.</span>
                        </p>
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}

export default LineList