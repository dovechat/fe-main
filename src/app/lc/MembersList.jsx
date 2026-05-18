import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { getMembers, addMember, removeMember } from '../../api/members'
import { getUserLinePermissions, addLinePermission, removeLinePermission } from '../../api/line-permissions'
import { getLines } from '../../api/lines'

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

function MembersList({ tenantId, onCountChange }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMember, setNewMember] = useState({ email: '', role: 'member' })
  const [addMemberError, setAddMemberError] = useState('')
  const [addMemberLoading, setAddMemberLoading] = useState(false)
  const [expandedMember, setExpandedMember] = useState(null)
  const [linePermissions, setLinePermissions] = useState({})
  const [allLines, setAllLines] = useState([])
  const [loadingLines, setLoadingLines] = useState(false)

  useEffect(() => {
    loadMembers()
  }, [tenantId])

  const loadMembers = async () => {
    setLoading(true)
    try {
      const data = await getMembers(tenantId)
      const list = Array.isArray(data) ? data : []
      setMembers(list)
      onCountChange?.(list.length)
    } catch (error) {
      console.error('Failed to load members:', error)
      setMembers([])
      onCountChange?.(0)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    setAddMemberError('')
    const email = newMember.email.trim()
    if (!email) {
      setAddMemberError('Укажите email')
      return
    }
    setAddMemberLoading(true)
    try {
      await addMember(tenantId, { email, role: newMember.role })
      setShowAddForm(false)
      setNewMember({ email: '', role: 'member' })
      await loadMembers()
    } catch (error) {
      setAddMemberError(error?.message || 'Не удалось добавить сотрудника')
    } finally {
      setAddMemberLoading(false)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!userId) return
    if (!window.confirm('Удалить сотрудника?')) return
    try {
      await removeMember(tenantId, userId)
      await loadMembers()
    } catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  const toggleMemberLines = async (userId) => {
    if (expandedMember === userId) {
      setExpandedMember(null)
    } else {
      setExpandedMember(userId)
      setLoadingLines(true)
      try {
        const lines = await getLines(tenantId)
        setAllLines(Array.isArray(lines) ? lines : [])
        const perms = await getUserLinePermissions(tenantId, userId)
        setLinePermissions((prev) => ({ ...prev, [userId]: perms }))
      } catch (error) {
        console.error('Failed to load lines/permissions:', error)
        setAllLines([])
      } finally {
        setLoadingLines(false)
      }
    }
  }

  if (loading) {
    return <p className="dc-muted">Загрузка сотрудников…</p>
  }

  return (
    <div className="dc-members-block">
      <div className="dc-detail-toolbar dc-detail-toolbar--plain">
        <button
          type="button"
          className="dc-btn dc-btn-primary"
          onClick={() => {
            setShowAddForm((v) => !v)
            setAddMemberError('')
          }}
        >
          <Plus size={18} />
          {showAddForm ? 'Свернуть' : 'Добавить сотрудника'}
        </button>
      </div>

      {showAddForm && (
        <div className="dc-add-member-panel">
          <div className="form-group">
            <label className="dc-muted-xs" style={{ display: 'block', marginBottom: '0.35rem' }}>Email</label>
            <input
              className="dc-input"
              type="email"
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              autoComplete="email"
              disabled={addMemberLoading}
            />
          </div>
          <div className="form-group">
            <label className="dc-muted-xs" style={{ display: 'block', marginBottom: '0.35rem' }}>Роль</label>
            <select
              className="dc-select"
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
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
                setShowAddForm(false)
                setAddMemberError('')
                setNewMember({ email: '', role: 'member' })
              }}
            >
              Отмена
            </button>
            <button
              type="button"
              className="dc-btn dc-btn-primary"
              disabled={addMemberLoading}
              onClick={handleAddMember}
            >
              {addMemberLoading ? '…' : 'Добавить'}
            </button>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <p className="dc-muted" style={{ marginTop: '0.75rem' }}>Нет сотрудников</p>
      ) : (
        <div className="dc-company-grid" style={{ marginTop: '0.75rem' }}>
          {members.map((member) => {
            const uid = member.user_id || member.id
            const email = member.user?.email || member.email || uid || '—'
            return (
              <div key={uid} className="dc-perm-card">
                <div className="dc-perm-row">
                  <div className="dc-perm-main">
                    <div className="dc-avatar dc-avatar-sm">{initials(member)}</div>
                    <div className="dc-perm-text">
                      <p className="dc-perm-email" title={email}>{email}</p>
                      <p className="dc-muted-xs" style={{ margin: '0.2rem 0 0' }}>
                        {member.role === 'admin' || member.role === 'owner' ? 'Полный доступ' : 'Ограниченный доступ'}
                      </p>
                    </div>
                  </div>
                  <div className="dc-perm-aside">
                    <span className={member.role === 'admin' ? 'dc-badge dc-badge-green' : 'dc-badge dc-badge-neutral'}>
                      {roleLabel(member.role)}
                    </span>
                    <div className="dc-perm-actions">
                      <button
                        type="button"
                        className="dc-btn dc-btn-outline dc-btn-sm"
                        onClick={() => toggleMemberLines(uid)}
                      >
                        {expandedMember === uid ? 'Скрыть' : 'Линии'}
                      </button>
                      <button type="button" className="dc-btn-ghost" aria-label="Изменить" title="Скоро" disabled>
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        className="dc-btn-ghost dc-btn-ghost-danger"
                        aria-label="Удалить"
                        onClick={() => handleRemoveMember(uid)}
                      >
                        <Trash2 size={14} style={{ color: '#dc2626' }} />
                      </button>
                    </div>
                  </div>
                </div>

                {expandedMember === uid && (
                  <div className="dc-lines-panel">
                    <p className="dc-muted-xs" style={{ margin: 0 }}>Доступ к линиям связи</p>
                    {loadingLines ? (
                      <p className="dc-muted" style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem' }}>Загрузка…</p>
                    ) : allLines.length === 0 ? (
                      <p className="dc-muted" style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem' }}>Линии не настроены.</p>
                    ) : (
                      <div className="dc-lines-list">
                        {allLines.map((line) => {
                          const hasAccess = linePermissions[uid]?.some((perm) => perm.line_id === line.id)
                          return (
                            <div key={line.id}>
                              <label>
                                <input
                                  type="checkbox"
                                  checked={hasAccess}
                                  onChange={async (e) => {
                                    try {
                                      if (e.target.checked) {
                                        await addLinePermission(tenantId, {
                                          user_id: uid,
                                          line_id: line.id,
                                          action: 'send',
                                        })
                                      } else {
                                        await removeLinePermission(tenantId, uid, line.id)
                                      }
                                      const perms = await getUserLinePermissions(tenantId, uid)
                                      setLinePermissions((prev) => ({ ...prev, [uid]: perms }))
                                    } catch (err) {
                                      console.error(err)
                                    }
                                  }}
                                />
                                <span>{line.name}</span>
                              </label>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MembersList