import { useState, useEffect } from 'react'
import Button from './Button'
import Input from './Input'
import { getMembers, addMember, removeMember } from '../../api/members'
import { getUserLinePermissions, addLinePermission, removeLinePermission } from '../../api/line-permissions'
import { getLines } from '../../api/lines'

function MembersList({ tenantId }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMember, setNewMember] = useState({ email: '', role: 'member' })
  const [expandedMember, setExpandedMember] = useState(null)
  const [linePermissions, setLinePermissions] = useState({})
  const [allLines, setAllLines] = useState([])
  const [loadingLines, setLoadingLines] = useState(false)

  useEffect(() => {
    loadMembers()
  }, [tenantId])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const data = await getMembers(tenantId)
      setMembers(data)
    } catch (error) {
      console.error('Failed to load members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    try {
      await addMember(tenantId, newMember)
      setShowAddForm(false)
      setNewMember({ email: '', role: 'member' })
      loadMembers()
    } catch (error) {
      console.error('Failed to add member:', error)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!confirm('Удалить сотрудника?')) return
    try {
      await removeMember(tenantId, userId)
      loadMembers()
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
        // Загружаем все линии компании
        const lines = await getLines(tenantId)
        setAllLines(lines)
        
        // Загружаем доступы сотрудника
        const perms = await getUserLinePermissions(tenantId, userId)
        setLinePermissions(prev => ({ ...prev, [userId]: perms }))
      } catch (error) {
        console.error('Failed to load lines/permissions:', error)
      } finally {
        setLoadingLines(false)
      }
    }
  }

  if (loading) return <div>Загрузка...</div>

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      


      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', borderBottom: '1px solid #e1e4e8', paddingBottom: '8px', margin: 0 }}>
          Сотрудники
        </h3>
        <Button 
          variant="success" 
          onClick={() => setShowAddForm(true)}
          style={{ fontSize: '14px', padding: '6px 12px', width: '70%'}}
        >
          + Добавить сотрудника
        </Button>
      </div>





      {showAddForm && (
        <form onSubmit={handleAddMember} style={{ marginBottom: '20px', padding: '16px', background: '#f5f7fa', borderRadius: '8px' }}>
          <Input
            label="Email"
            type="email"
            value={newMember.email}
            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
            required
          />
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Роль</label>
            <select
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="member">Сотрудник</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="submit" variant="primary">Добавить</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>Отмена</Button>
          </div>
        </form>
      )}

      {members.length === 0 ? (
        <p style={{ color: '#666' }}>Нет сотрудников</p>
      ) : (
        <div>
          {members.map((member) => (
            <div key={member.id} style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div><strong>{member.user?.email || member.user_id}</strong></div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Роль: {member.role}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" onClick={() => toggleMemberLines(member.user_id)}>
                    {expandedMember === member.user_id ? 'Скрыть линии' : 'Линии'}
                  </Button>
                  <Button variant="danger" onClick={() => handleRemoveMember(member.user_id)}>
                    Удалить
                  </Button>
                </div>
              </div>





              {expandedMember === member.user_id && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#f5f7fa', borderRadius: '8px' }}>
                  {loadingLines ? (
                    <p style={{ color: '#666', fontSize: '14px' }}>Загрузка линий...</p>
                  ) : (
                    <div>
                      <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Доступные линии</h4>
                      {allLines.map(line => {
                        const hasAccess = linePermissions[member.user_id]?.some(
                          perm => perm.line_id === line.id
                        )
                        return (
                          <div key={line.id} style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="checkbox"
                                checked={hasAccess}
                                onChange={async (e) => {
                                  if (e.target.checked) {
                                    await addLinePermission(tenantId, {
                                      user_id: member.user_id,
                                      line_id: line.id,
                                      action: 'send'
                                    })
                                  } else {
                                    await removeLinePermission(tenantId, member.user_id, line.id)
                                  }
                                  // Перезагрузить доступы после изменения
                                  const perms = await getUserLinePermissions(tenantId, member.user_id)
                                  setLinePermissions(prev => ({ ...prev, [member.user_id]: perms }))
                                }}
                              />
                              {line.name}
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}




            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MembersList