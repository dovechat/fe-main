import { useState, useEffect } from 'react'
import client from '../../services/client'

const ROLE_LABELS = {
  admin: 'Администратор',
  manager: 'Менеджер',
  owner: 'Владелец',
  user: 'Пользователь',
}

const STATUS_LABELS = {
  active: 'Активен',
  trial: 'Пробный период',
  inactive: 'Неактивен',
  disabled: 'Заблокирован',
}

export default function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveOk, setSaveOk] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [pwModal, setPwModal] = useState(false)
  const [pw, setPw] = useState({ password: '', password_confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwOk, setPwOk] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  useEffect(() => {
    client.get('/auth/users/me')
      .then(r => {
        setUser(r.data)
        setForm({ full_name: r.data.full_name || '', phone: r.data.phone || '' })
      })
      .catch(() => setError('Не удалось загрузить профиль'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    setSaveOk(false)
    try {
      const r = await client.patch('/auth/users/me', form)
      setUser(r.data)
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 3000)
    } catch {
      setSaveError('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPwSaving(true)
    setPwError('')
    setPwOk(false)
    try {
      await client.post('/auth/users/me/password', pw)
      setPwOk(true)
      setPw({ password: '', password_confirm: '' })
      setTimeout(() => { setPwModal(false); setPwOk(false) }, 1500)
    } catch (e) {
      setPwError(e.response?.data?.detail || 'Ошибка смены пароля')
    } finally {
      setPwSaving(false)
    }
  }

  if (loading) return <div className="profile-page">Загрузка...</div>
  if (error) return <div className="profile-page">{error}</div>

  return (
    <div className="profile-page">
      <h1 className="profile-title">Профиль</h1>
      <div className="profile-card">
        <div className="profile-row">
          <span className="profile-label">Email</span>
          <span className="profile-value">{user.email}</span>
        </div>
        <div className="profile-row">
          <span className="profile-label">Роль</span>
          <span className="profile-value">{ROLE_LABELS[user.role] || user.role}</span>
        </div>
        <div className="profile-row">
          <span className="profile-label">Статус</span>
          <span className="profile-value">{STATUS_LABELS[user.status] || user.status}</span>
        </div>
        <div className="profile-row">
          <span className="profile-label">Зарегистрирован</span>
          <span className="profile-value">{user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '—'}</span>
        </div>
        <div className="profile-row">
          <span className="profile-label">Имя</span>
          <input
            className="profile-input"
            value={form.full_name}
            onChange={e => setForm({ ...form, full_name: e.target.value })}
            placeholder="Не указано"
          />
        </div>
        <div className="profile-row">
          <span className="profile-label">Телефон</span>
          <input
            className="profile-input"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            placeholder="Не указан"
          />
        </div>
        {saveError && <div className="profile-error">{saveError}</div>}
        {saveOk && <div className="profile-ok">Сохранено</div>}
        <div className="profile-actions">
          <button className="profile-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button className="profile-btn profile-btn--outline" onClick={() => setPwModal(true)}>
            Сменить пароль
          </button>
        </div>
      </div>

      {pwModal && (
        <div className="modal-overlay" onClick={() => setPwModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Смена пароля</div>
            <div className="login-field">
              <label>Новый пароль</label>
              <input
                type="password"
                value={pw.password}
                onChange={e => setPw({ ...pw, password: e.target.value })}
              />
            </div>
            <div className="login-field">
              <label>Повторите пароль</label>
              <input
                type="password"
                value={pw.password_confirm}
                onChange={e => setPw({ ...pw, password_confirm: e.target.value })}
              />
            </div>
            {pwError && <div className="profile-error">{pwError}</div>}
            {pwOk && <div className="profile-ok">Пароль изменён</div>}
            <div className="modal-actions">
              <button className="profile-btn" onClick={handleChangePassword} disabled={pwSaving}>
                {pwSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button className="profile-btn profile-btn--outline" onClick={() => setPwModal(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}