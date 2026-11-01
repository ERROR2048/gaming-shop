import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/ServiceAuthContext.jsx'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <p className="notice">Проверяем авторизацию…</p>
  if (!user) return <Navigate to="/services/login" replace state={{ from: location.pathname }} />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/services" replace />
  return children
}
