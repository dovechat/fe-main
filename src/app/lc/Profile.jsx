import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Phone, Lock, Save, Camera } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import client from '../../services/client'
import NotificationSettings from './NotificationSettings'
import NotificationHistory from './NotificationHistory'

const ROLE_LABELS = {
  admin: 'Администратор',
  manager: 'Менеджер',
  owner: 'Владелец',
  user: 'Пользователь',
}

const TAB_IDS = ['general', 'notifications', 'security']

function emailInitials(email) {
  if (!email) return '?'
  const local = email.split('@')[0] || ''
  const parts = local.split(/[._-]+/).filter(Boolean)
  if (parts.length >= 2 && parts[0][0] && parts[1][0])
    return (parts[0][0] + parts[1][0]).toUpperCase()
  return local.slice(0, 2).toUpperCase() || '?'
}

function DesignSwitch({ defaultChecked }) {
  const [on, setOn] = useState(!!defaultChecked)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={`dc-prof-switch ${on ? 'dc-prof-switch--on' : ''}`}
      onClick={() => setOn(!on)}
    >
      <span className="dc-prof-switch-thumb" />
    </button>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user: authUser, currentTenant } = useAuth()

  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(TAB_IDS.includes(tabFromUrl) ? tabFromUrl : 'general')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveOk, setSaveOk] = useState(false)
  const [showPwForm, setShowPwForm] = useState(false)
  const [pw, setPw] = useState({ password: '', password_confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwOk, setPwOk] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  useEffect(() => {
    const t = searchParams.get('tab')
    if (TAB_IDS.includes(t)) setActiveTab(t)
    else if (!t) setActiveTab('general')
  }, [searchParams])

  useEffect(() => {
    client.get('/auth/users/me')
      .then(r => {
        setUser(r.data)
        setForm({ full_name: r.data.full_name || '', phone: r.data.phone || '' })
      })
      .catch(() => setError('Не удалось загрузить профиль'))
      .finally(() => setLoading(false))
  }, [])

  const setTab = (id) => {
    setActiveTab(id)
    setSearchParams(id === 'general' ? {} : { tab: id }, { replace: true })
  }

  const handleSave = async () => {
    setSaving(true); setSaveError(''); setSaveOk(false)
    try {
      const r = await client.patch('/auth/users/me', form)
      setUser(r.data); setSaveOk(true)
      setTimeout(() => setSaveOk(false), 3000)
    } catch { setSaveError('Ошибка сохранения') }
    finally { setSaving(false) }
  }

  const handleChangePassword = async () => {
    setPwSaving(true); setPwError(''); setPwOk(false)
    try {
      await client.post('/auth/users/me/password', pw)
      setPwOk(true)
      setPw({ password: '', password_confirm: '' })
      setTimeout(() => { setShowPwForm(false); setPwOk(false) }, 1500)
    } catch (e) {
      setPwError(e.response?.data?.detail || 'Ошибка смены пароля')
    } finally { setPwSaving(false) }
  }

  const currentTenantId = currentTenant?.id ?? null
  const userEmail = user?.email || authUser?.email || ''
  const memberLabel = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date())

  if (loading) return <div className="dc-prof-page"><p className="dc-muted">Загрузка...</p></div>
  if (error)   return <div className="dc-prof-page"><p className="error">{error}</p></div>

  return (
    <div className="dc-prof-page">
      <div className="dc-prof-inner">
        <div className="dc-prof-header-block">
          <h1 className="dc-prof-title">Настройки профиля</h1>
          <p className="dc-prof-subtitle">Управление информацией учётной записи и настройками</p>
        </div>

        <div className="dc-prof-card dc-prof-card--hero">
          <div className="dc-prof-hero-inner">
            <div className="dc-prof-avatar-wrap">
              <div className="dc-prof-avatar">{emailInitials(userEmail)}</div>
              <button type="button" className="dc-prof-camera-btn" aria-label="Загрузить фото">
                <Camera className="dc-prof-camera-icon" />
              </button>
            </div>
            <div className="dc-prof-hero-meta">
              <h2 className="dc-prof-hero-name">{form.full_name || userEmail}</h2>
              <p className="dc-prof-hero-email">{userEmail}</p>
              <div className="dc-prof-hero-badges">
                <span className="dc-prof-badge-active">
                  <span className="dc-prof-badge-dot" />
                  Активен
                </span>
                <span className="dc-prof-member">{ROLE_LABELS[user?.role] || user?.role}</span>
                <span className="dc-prof-member">Участник с {memberLabel}</span>
              </div>
            </div>
            <button type="button" className="dc-prof-btn-outline"
              onClick={() => { setTab('security'); setShowPwForm(true) }}>
              Изменить пароль
            </button>
          </div>
        </div>

        <div className="dc-prof-tabs-root">
          <div className="dc-prof-tabs-list" role="tablist">
            {TAB_IDS.map(id => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                className={`dc-prof-tab ${activeTab === id ? 'dc-prof-tab--active' : ''}`}
                onClick={() => setTab(id)}
              >
                {{ general: 'Общие', notifications: 'Уведомления', security: 'Безопасность', preferences: 'Настройки' }[id]}
              </button>
            ))}
          </div>

          {/* ── Общие ── */}
          {activeTab === 'general' && (
            <div className="dc-prof-tab-panels">
              <div className="dc-prof-stack">

                <div className="dc-prof-card dc-prof-card--section">
                  <div className="dc-prof-card-head">
                    <h3 className="dc-prof-card-title">Персональная информация</h3>
                    <p className="dc-prof-card-desc">Обновите свои личные данные и контактную информацию</p>
                  </div>
                  <div className="dc-prof-card-body">
                    <div className="dc-prof-field">
                      <label className="dc-prof-label" htmlFor="prof-name">Имя</label>
                      <input id="prof-name" className="dc-prof-input" type="text"
                        value={form.full_name}
                        onChange={e => setForm({ ...form, full_name: e.target.value })}
                        placeholder="Не указано" />
                    </div>
                    <div className="dc-prof-field">
                      <label className="dc-prof-label" htmlFor="prof-email">Электронная почта</label>
                      <div className="dc-prof-input-icon-wrap">
                        <Mail className="dc-prof-input-icon" aria-hidden />
                        <input id="prof-email" className="dc-prof-input dc-prof-input--pl"
                          type="email" value={userEmail} readOnly />
                      </div>
                    </div>
                    <div className="dc-prof-field">
                      <label className="dc-prof-label" htmlFor="prof-phone">Телефон</label>
                      <div className="dc-prof-input-icon-wrap">
                        <Phone className="dc-prof-input-icon" aria-hidden />
                        <input id="prof-phone" className="dc-prof-input dc-prof-input--pl" type="tel"
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          placeholder="Не указан" />
                      </div>
                    </div>
                    {/* Роль в системе */}
                    <div className="dc-prof-field">
                      <label className="dc-prof-label">Роль в системе</label>
                      <input
                        className="dc-prof-input"
                        value={{ owner: 'Владелец', admin: 'Администратор', support: 'Поддержка', user: 'Пользователь' }[user?.role] ?? user?.role ?? '—'}
                        readOnly
                      />
                    </div>
                    {saveError && <p className="error">{saveError}</p>}
                    {saveOk && <p style={{ color: '#16a34a', fontSize: '0.875rem' }}>Сохранено</p>}
                    <div className="dc-prof-actions-end">
                      <button type="button" className="dc-prof-btn-gradient"
                        onClick={handleSave} disabled={saving}>
                        <Save className="dc-prof-btn-icon" />
                        {saving ? 'Сохранение...' : 'Сохранить изменения'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="dc-prof-card dc-prof-card--section">
                  <div className="dc-prof-card-head">
                    <h3 className="dc-prof-card-title">Информация о компании</h3>
                    <p className="dc-prof-card-desc">Сведения о вашей организации</p>
                  </div>
                  <div className="dc-prof-card-body">
                    <div className="dc-prof-field">
                      <label className="dc-prof-label">Название компании</label>
                      <input className="dc-prof-input" type="text"
                        value={currentTenant?.name || '—'} readOnly />
                    </div>
                    <div className="dc-prof-field">
                      <label className="dc-prof-label">Роль в компании</label>
                      <input className="dc-prof-input" type="text"
                        value={ROLE_LABELS[user?.role] || user?.role || '—'} readOnly />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ── Уведомления ── */}
          {activeTab === 'notifications' && (
            <div className="dc-prof-tab-panels">
              <div className="dc-prof-stack">
                {!currentTenantId ? (
                  <div className="dc-prof-card dc-prof-card--section">
                    <div className="dc-prof-card-body">
                      <p className="dc-prof-desc" style={{ margin: '0 0 1rem' }}>
                        Выберите компанию в сайдбаре, чтобы настроить уведомления.
                      </p>
                      <button type="button" className="dc-prof-btn-gradient"
                        onClick={() => navigate('/lc/companies')}>
                        К списку компаний
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="dc-prof-card dc-prof-card--section">
                      <div className="dc-prof-card-head">
                        <h3 className="dc-prof-card-title">Настройки уведомлений</h3>
                        <p className="dc-prof-card-desc">Управление каналами уведомлений</p>
                      </div>
                      <div className="dc-prof-card-body">
                        <NotificationSettings currentTenantId={currentTenantId} />
                      </div>
                    </div>
                    <div className="dc-prof-card dc-prof-card--section">
                      <div className="dc-prof-card-head">
                        <h3 className="dc-prof-card-title">История уведомлений</h3>
                        <p className="dc-prof-card-desc">Лог отправленных и запланированных уведомлений</p>
                      </div>
                      <div className="dc-prof-card-body">
                        <NotificationHistory currentTenantId={currentTenantId} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Безопасность ── */}
          {activeTab === 'security' && (
            <div className="dc-prof-tab-panels">
              <div className="dc-prof-stack">
                <div className="dc-prof-card dc-prof-card--section">
                  <div className="dc-prof-card-head">
                    <h3 className="dc-prof-card-title">Смена пароля</h3>
                    <p className="dc-prof-card-desc">Регулярно обновляйте пароль для безопасности</p>
                  </div>
                  <div className="dc-prof-card-body">
                    {!showPwForm ? (
                      <button type="button" className="dc-prof-btn-outline"
                        onClick={() => setShowPwForm(true)}>
                        <Lock className="dc-prof-btn-icon" />
                        Изменить пароль
                      </button>
                    ) : (
                      <>
                        <div className="dc-prof-field">
                          <label className="dc-prof-label">Новый пароль</label>
                          <input className="dc-prof-input" type="password"
                            value={pw.password}
                            onChange={e => setPw({ ...pw, password: e.target.value })} />
                        </div>
                        <div className="dc-prof-field">
                          <label className="dc-prof-label">Повторите пароль</label>
                          <input className="dc-prof-input" type="password"
                            value={pw.password_confirm}
                            onChange={e => setPw({ ...pw, password_confirm: e.target.value })} />
                        </div>
                        {pwError && <p className="error">{pwError}</p>}
                        {pwOk && <p style={{ color: '#16a34a', fontSize: '0.875rem' }}>Пароль изменён</p>}
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                          <button type="button" className="dc-prof-btn-gradient"
                            onClick={handleChangePassword} disabled={pwSaving}>
                            <Save className="dc-prof-btn-icon" />
                            {pwSaving ? 'Сохранение...' : 'Сохранить'}
                          </button>
                          <button type="button" className="dc-prof-btn-outline"
                            onClick={() => { setShowPwForm(false); setPwError('') }}>
                            Отмена
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Настройки ── */}

          {activeTab === 'preferences' && (
            <div className="dc-prof-tab-panels">
              <div className="dc-prof-stack">
                <div className="dc-prof-card dc-prof-card--section">
                  <div className="dc-prof-card-head">
                    <h3 className="dc-prof-card-title">Настройки приложения</h3>
                    <p className="dc-prof-card-desc">Настройте свой опыт</p>
                  </div>
                  <div className="dc-prof-card-body">
                    <div className="dc-prof-notif-row">
                      <div className="dc-prof-notif-row-text">
                        <span className="dc-prof-label-strong">Тёмная тема</span>
                        <p className="dc-prof-desc">Переключиться на тёмную тему</p>
                      </div>
                      <DesignSwitch />
                    </div>
                    <div className="dc-prof-notif-row">
                      <div className="dc-prof-notif-row-text">
                        <span className="dc-prof-label-strong">Компактный вид</span>
                        <p className="dc-prof-desc">Показывать больше контента в меньшем пространстве</p>
                      </div>
                      <DesignSwitch />
                    </div>
                    <p className="dc-muted-xs" style={{ marginTop: '1rem' }}>
                      Скоро здесь появятся дополнительные настройки
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}