import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { Spinner } from '@/components/ui/Spinner'

/**
 * Redirects authenticated users to their role-appropriate home page.
 * Unauthenticated users go to /login.
 */
export function RoleRedirect() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
        <Spinner size="lg" className="text-[var(--color-primary)]" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  const dest = profile?.role === 'employee' ? '/employee/queries' : '/dashboard'
  return <Navigate to={dest} replace />
}
