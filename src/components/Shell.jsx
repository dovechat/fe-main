import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'

export default function Shell() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="shell">
      <Sidebar />
      <main className="shell-content">
        <Outlet />
      </main>
    </div>
  )
}