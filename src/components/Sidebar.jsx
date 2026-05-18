import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MessageSquare, Building2, Network, Bell, CreditCard, User, LogOut } from 'lucide-react'
import React from 'react'

const APPS = [
  { path: '/chats', label: 'Чаты', icon: MessageSquare },
  { path: '/lc/companies', label: 'Компании', icon: Building2 },
  { path: '/lc/lines', label: 'Линии', icon: Network },
  // { path: '/lc/notifications', label: 'Уведомления', icon: Bell },
  { path: '/lc/billing', label: 'Биллинг', icon: CreditCard },
  { path: '/lc/profile', label: 'Профиль', icon: User },
]

export default function Sidebar() {
  const { user, logout, currentTenant } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <NavLink to="/lc/lines">
          <img src="/src/assets/logo_main.png" alt="DoveChat" style={{ height: '102px', width: 'auto' }} />
        </NavLink>
      </div>

      <nav className="sidebar-nav">
        {APPS.map((item, index) => (
          <React.Fragment key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
              style={index === 1 ? { marginTop: '20px' } : undefined}
            >
              <item.icon size={20} style={{ flexShrink: 0 }} />
              <span>{item.label}</span>
            </NavLink>
            {index === 0 && <div className="app-nav-divider" aria-hidden="true" />}
          </React.Fragment>
        ))}
      </nav>

      <div className="app-sidebar-footer">
        {currentTenant && (
          <p className="app-company-label">
            Компания: <strong>{currentTenant.name || 'Без названия'}</strong>
          </p>
        )}
        <div className="app-user-block">
          <div className="app-user-avatar" aria-hidden="true">
            {user?.email?.slice(0, 2).toUpperCase() || 'DO'}
          </div>
          <div className="app-user-meta">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p className="app-user-name">Аккаунт</p>
              <NavLink to="/lc/profile?tab=notifications" className="app-user-bell" title="Уведомления">
                <Bell size={18} />
              </NavLink>
            </div>
            <p className="app-user-email">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-danger app-logout-btn"
          onClick={logout}
        >
          <LogOut size={18} aria-hidden="true" />
          Выйти
        </button>
      </div>
    </aside>
  )
}