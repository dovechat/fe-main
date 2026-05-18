import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTenants, switchTenant } from '../../api/tenants'
import { getMembers, addMember, removeMember } from '../../api/members'
import { useAuth } from '../../context/AuthContext'
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Users,
  Shield,
} from 'lucide-react'

function roleLabel(role) {
  if (role === 'admin') return 'Администратор'
  if (role === 'member') return 'Сотрудник'
  return role || '—'
}

function initials(m) {
  const name = m.name || m.user?.email || m.email || ''
  const parts = name.split(/[\s@]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase() || '?'
}

function dash(v) {
  if (v == null || String(v).trim() === '') return '—'
  return v
}

// Плейсхолдеры для полей, которых пока нет в бэкенде
const PLACEHOLDER = {
  address: 'ул. Тестовая, 1',
  phone: '+7 999 123-45-67',
  email: 'test@example.com',
  inn: '0000000000',
  employee_count: null,
}

function TenantList({ currentTenantId, onTenantClick, onCreateClick, onTenantSelected }) {
  const navigate = useNavigate()
  const { updateToken, setCurrentTenant } = useAuth()
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [switching, setSwitching] = useState(null)
  const [tab, setTab] = useState('companies')
  const [permTenantId, setPermTenantId] = useState('')
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [addMemberEmail, setAddMemberEmail] = useState('')
  const [addMemberRole, setAddMemberRole] = useState('member')
  const [addMemberError, setAddMemberError] = useState('')
  const [addMemberLoading, setAddMemberLoading] = useState(false)

  useEffect(() => {
    loadTenants()
  }, [])

  useEffect(() => {
    if (tenants.length && !permTenantId) {
      setPermTenantId(tenants[0].id)
    }
  }, [tenants, permTenantId])

  const loadPermMembers = useCallback(async () => {
    if (!permTenantId) return
    setMembersLoading(true)
    try {
      const data = await getMembers(permTenantId)
      setMembers(Array.isArray(data) ? data : [])
    } catch {
      setMembers([])
    } finally {
      setMembersLoading(false)
    }
  }, [permTenantId])

  useEffect(() => {
    if (tab !== 'permissions' || !permTenantId) return
    loadPermMembers()
  }, [tab, permTenantId, loadPermMembers])

  useEffect(() => {
    setShowAddMember(false)
    setAddMemberEmail('')
    setAddMemberRole('member')
    setAddMemberError('')
  }, [permTenantId])

  const loadTenants = async () => {
    try {
      setLoading(true)
      const data = await getTenants()
      setTenants(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTenant = async (tenantId, e) => {
    e.stopPropagation()
    if (tenantId === currentTenantId) return
    try {
      setSwitching(tenantId)
      const data = await switchTenant(tenantId)
      updateToken(data.access_token, data.refresh_token)
      const selected = tenants.find(t => t.id === tenantId)
      if (selected) setCurrentTenant(selected)
      if (onTenantSelected) onTenantSelected(tenantId)
    } catch (err) {
      setError(err.message)
    } finally {
      setSwitching(null)
    }
  }

  const handleSubmitAddMember = async () => {
    setAddMemberError('')
    const email = addMemberEmail.trim()
    if (!email) {
      setAddMemberError('Укажите email')
      return
    }
    if (!permTenantId) return
    setAddMemberLoading(true)
    try {
      await addMember(permTenantId, { email, role: addMemberRole })
      setAddMemberEmail('')
      setAddMemberRole('member')
      setShowAddMember(false)
      await loadPermMembers()
    } catch (err) {
      setAddMemberError(err?.message || 'Не удалось добавить сотрудника')
    } finally {
      setAddMemberLoading(false)
    }
  }

  const handleRemovePermMember = async (userId) => {
    if (!permTenantId || !userId) return
    if (!window.confirm('Удалить сотрудника?')) return
    try {
      await removeMember(permTenantId, userId)
      await loadPermMembers()
    } catch (err) {
      setError(err?.message || 'Не удалось удалить сотрудника')
    }
  }

  if (loading) {
    return (
      <div className="dc-fe-page">
        <p className="dc-muted">Загрузка компаний...</p>
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

  return (
    <div className="dc-fe-page dc-fe-stack">
      <div className="dc-fe-header">
        <div>
          <h1 className="dc-fe-title">Компании</h1>
          <p className="dc-fe-subtitle">Управление организациями и доступами сотрудников</p>
        </div>
        <div className="dc-fe-actions">
          <button type="button" className="dc-btn dc-btn-primary" onClick={onCreateClick}>
            <Plus size={18} />
            Добавить компанию
          </button>
        </div>
      </div>

      <div className="dc-tabs-list" role="tablist">
        <button
          type="button"
          role="tab"
          className={`dc-tab-btn ${tab === 'companies' ? 'is-active' : ''}`}
          onClick={() => setTab('companies')}
        >
          Компании
        </button>
        <button
          type="button"
          role="tab"
          className={`dc-tab-btn ${tab === 'permissions' ? 'is-active' : ''}`}
          onClick={() => setTab('permissions')}
        >
          Доступы
        </button>
      </div>

      {tab === 'companies' && (
        <div className="dc-tab-panel">
          {tenants.length === 0 ? (
            <div className="dc-card dc-empty">
              <p style={{ marginBottom: '1rem' }}>У вас пока нет компаний</p>
              <button type="button" className="dc-btn dc-btn-primary" onClick={onCreateClick}>
                <Plus size={18} />
                Создать первую компанию
              </button>
            </div>
          ) : (
            <div className="dc-company-grid">
              {tenants.map((tenant) => {
                const bd = tenant.banking_details || {}
                const isActive = tenant.id === currentTenantId
                return (
                  <div
                    key={tenant.id}
                    className="dc-card dc-card-pad dc-card-clickable"
                    onClick={() => onTenantClick(tenant)}
                    style={{ outline: isActive ? '2px solid #3b82f6' : undefined }}
                  >
                    <div className="dc-company-row">
                      <div style={{ display: 'flex', gap: '1rem', minWidth: 0, flex: 1 }}>
                        <div className="dc-icon-tile">
                          <Building2 size={22} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ marginBottom: '0.75rem' }}>
                            <h3 className="dc-company-title">{tenant.name}</h3>
                            <p className="dc-muted-xs" style={{ marginTop: '0.25rem' }}>
                              Локаль: {tenant.locale} · Оплата: {tenant.payment}
                              {isActive && (
                                <span className="dc-badge dc-badge-green" style={{ marginLeft: '0.5rem' }}>
                                  Активная
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="dc-field-grid">
                            <div>
                              <p className="dc-muted-xs">Адрес</p>
                              <p className="dc-strong">{dash(tenant.address) === '—' ? PLACEHOLDER.address : tenant.address}</p>
                            </div>
                            <div>
                              <p className="dc-muted-xs">Телефон</p>
                              <p className="dc-strong">{dash(tenant.phone) === '—' ? PLACEHOLDER.phone : tenant.phone}</p>
                            </div>
                            <div>
                              <p className="dc-muted-xs">Email</p>
                              <p className="dc-strong">{dash(tenant.email) === '—' ? PLACEHOLDER.email : tenant.email}</p>
                            </div>
                            <div>
                              <p className="dc-muted-xs">ИНН</p>
                              <p className="dc-strong">{dash(tenant.inn) === '—' ? PLACEHOLDER.inn : tenant.inn}</p>
                            </div>
                            <div>
                              <p className="dc-muted-xs">Сотрудники</p>
                              <p className="dc-strong" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Users size={14} style={{ color: '#3b82f6' }} />
                                {tenant.employee_count != null ? tenant.employee_count : '0'}
                              </p>
                            </div>
                          </div>
                          <div className="dc-req-block">
                            <p className="dc-muted-xs" style={{ marginBottom: '0.5rem' }}>Реквизиты</p>
                            <div className="dc-req-grid">
                              <div>
                                <span className="dc-muted-xs">Банк: </span>
                                <span className="dc-strong">{bd.bank_name || '—'}</span>
                              </div>
                              <div>
                                <span className="dc-muted-xs">Р/С: </span>
                                <span className="dc-strong">{bd.account_number || '—'}</span>
                              </div>
                              <div>
                                <span className="dc-muted-xs">БИК: </span>
                                <span className="dc-strong">{bd.bic || '—'}</span>
                              </div>
                            </div>
                            {(bd.corr_account || bd.kpp || bd.currency) && (
                              <div className="dc-req-grid" style={{ marginTop: '0.5rem' }}>
                                <div>
                                  <span className="dc-muted-xs">К/С: </span>
                                  <span className="dc-strong">{bd.corr_account || '—'}</span>
                                </div>
                                <div>
                                  <span className="dc-muted-xs">КПП: </span>
                                  <span className="dc-strong">{bd.kpp || '—'}</span>
                                </div>
                                <div>
                                  <span className="dc-muted-xs">Валюта: </span>
                                  <span className="dc-strong">{bd.currency || '—'}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            type="button"
                            className="dc-btn-ghost"
                            title="Редактировать"
                            onClick={(e) => {
                              e.stopPropagation()
                              onTenantClick(tenant)
                            }}
                          >
                            <Edit size={18} style={{ color: '#2563eb' }} />
                          </button>
                          <button
                            type="button"
                            className="dc-btn-ghost dc-btn-ghost-danger"
                            title="Удалить"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.alert('Удаление компании через API пока не подключено.')
                            }}
                          >
                            <Trash2 size={18} style={{ color: '#dc2626' }} />
                          </button>
                        </div>
                        {!isActive && (
                          <button
                            type="button"
                            className="dc-btn-sm"
                            onClick={(e) => handleSelectTenant(tenant.id, e)}
                            disabled={switching === tenant.id}
                          >
                            {switching === tenant.id ? '…' : 'Активировать'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'permissions' && (
        <div className="dc-tab-panel">
          <div className="dc-card dc-card-pad">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <Shield size={22} style={{ color: '#2563eb' }} />
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Доступы сотрудников</h2>
            </div>

            {tenants.length === 0 ? (
              <p className="dc-muted">Сначала создайте компанию.</p>
            ) : (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="dc-muted-xs" style={{ display: 'block', marginBottom: '0.35rem' }}>
                    Компания
                  </label>
                  <select
                    className="dc-select"
                    value={permTenantId}
                    onChange={(e) => setPermTenantId(e.target.value)}
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="dc-detail-toolbar dc-detail-toolbar--plain">
                  <button
                    type="button"
                    className="dc-btn dc-btn-primary"
                    onClick={() => {
                      setShowAddMember(v => !v)
                      setAddMemberError('')
                    }}
                  >
                    <Plus size={18} />
                    {showAddMember ? 'Свернуть' : 'Добавить сотрудника'}
                  </button>
                </div>

                {showAddMember && (
                  <div className="dc-add-member-panel">
                    <div className="form-group">
                      <label className="dc-muted-xs" style={{ display: 'block', marginBottom: '0.35rem' }}>Email</label>
                      <input
                        className="dc-input"
                        type="email"
                        value={addMemberEmail}
                        onChange={(e) => setAddMemberEmail(e.target.value)}
                        autoComplete="email"
                        disabled={addMemberLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label className="dc-muted-xs" style={{ display: 'block', marginBottom: '0.35rem' }}>Роль</label>
                      <select
                        className="dc-select"
                        value={addMemberRole}
                        onChange={(e) => setAddMemberRole(e.target.value)}
                        disabled={addMemberLoading}
                      >
                        <option value="member">Сотрудник</option>
                        <option value="admin">Администратор</option>
                      </select>
                    </div>
                    {addMemberError && (
                      <p className="error" style={{ margin: '0 0 0.75rem' }}>{addMemberError}</p>
                    )}
                    <div className="dc-detail-toolbar" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                      <button
                        type="button"
                        className="dc-btn dc-btn-outline"
                        disabled={addMemberLoading}
                        onClick={() => {
                          setShowAddMember(false)
                          setAddMemberError('')
                          setAddMemberEmail('')
                          setAddMemberRole('member')
                        }}
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        className="dc-btn dc-btn-primary"
                        disabled={addMemberLoading}
                        onClick={handleSubmitAddMember}
                      >
                        {addMemberLoading ? '…' : 'Добавить'}
                      </button>
                    </div>
                  </div>
                )}

                {membersLoading ? (
                  <p className="dc-muted">Загрузка…</p>
                ) : (
                  <div className="dc-company-grid">
                    {members.length === 0 ? (
                      <p className="dc-muted">Нет сотрудников для выбранной компании.</p>
                    ) : (
                      members.map((m) => {
                        const email = m.user?.email || m.email || m.user_id || '—'
                        return (
                          <div key={m.user_id || m.id} className="dc-perm-card">
                            <div className="dc-perm-row">
                              <div className="dc-perm-main">
                                <div className="dc-avatar dc-avatar-sm">{initials(m)}</div>
                                <div className="dc-perm-text">
                                  <p className="dc-perm-email" title={email}>{email}</p>
                                  <p className="dc-muted-xs" style={{ margin: '0.2rem 0 0' }}>
                                    {m.role === 'admin' || m.role === 'owner' ? 'Полный доступ' : 'Ограниченный доступ'}
                                  </p>
                                </div>
                              </div>
                              <div className="dc-perm-aside">
                                <span className={m.role === 'admin' || m.role === 'owner' ? 'dc-badge dc-badge-green' : 'dc-badge dc-badge-neutral'}>
                                  {roleLabel(m.role)}
                                </span>
                                <div className="dc-perm-actions">
                                  <button
                                    type="button"
                                    className="dc-btn-ghost"
                                    aria-label="Изменить"
                                    title="Скоро"
                                    disabled
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="dc-btn-ghost dc-btn-ghost-danger"
                                    aria-label="Удалить"
                                    onClick={() => handleRemovePermMember(m.user_id || m.id)}
                                  >
                                    <Trash2 size={14} style={{ color: '#dc2626' }} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TenantList