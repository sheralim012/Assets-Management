import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { useAuth } from '@/features/auth/useAuth'

export function EmployeeLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/cogent-logo.png"
              alt="Cogent"
              className="h-8 w-auto"
              style={{
                filter:
                  'brightness(0) saturate(100%) invert(26%) sepia(52%) saturate(651%) hue-rotate(172deg) brightness(89%) contrast(96%)',
              }}
            />
            <span
              className="text-lg font-bold text-[var(--color-royal-blue)]"
              style={{ fontFamily: 'Playwrite NO, cursive' }}
            >
              assets
            </span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            {profile && (
              <div className="flex items-center gap-2">
                <Avatar
                  src={profile.avatar_url}
                  name={profile.name}
                  size="sm"
                />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {profile.name}
                </span>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
