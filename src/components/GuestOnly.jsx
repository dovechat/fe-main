import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function GuestOnly({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (isAuthenticated) return <Navigate to="/chats" replace />
  return children
}
