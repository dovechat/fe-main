import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const APPS = [
  { path: '/chats', label: 'Чаты', icon: '💬' },
  { path: '/lc/companies', label: 'Компании', icon: '🏢' },
  { path: '/lc/lines', label: 'Линии', icon: '📡' },
  { path: '/lc/notifications', label: 'Уведомления', icon: '⚙️' },
  { path: '/lc/billing', label: 'Биллинг', icon: '💳' },
  { path: '/lc/profile', label: 'Профиль', icon: '👤' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">🕊</span>
        <span className="sidebar-logo-text">DoveChat</span>
      </div>

      <nav className="sidebar-nav">
        {APPS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
            }
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">{user?.email}</div>
        <button className="sidebar-logout" onClick={logout}>Выйти</button>
      </div>
    </aside>
  )
}