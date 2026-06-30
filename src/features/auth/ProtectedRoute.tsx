import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'
import { Spinner } from '@/components/ui/Spinner'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  children?: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
        <Spinner size="lg" className="text-[var(--color-primary)]" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect to their own home page instead of a generic 403
    const dest = profile.role === 'employee' ? '/employee/queries' : '/dashboard'
    return <Navigate to={dest} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
