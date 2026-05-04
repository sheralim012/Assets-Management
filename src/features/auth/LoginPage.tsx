import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from './useAuth'
import { Button } from '@/components/ui/Button'

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

const ERROR_MESSAGES: Record<string, string> = {
  wrong_domain: 'Only @cogentlabs.co email addresses are allowed.',
  not_admin: 'Access denied. Only admin users can log in to this portal. Contact your administrator.',
  no_session: 'Sign in failed. Please try again.',
  access_denied: 'Access denied. Contact your administrator.',
  domain: 'Only @cogentlabs.co email addresses are allowed.',
  auth: 'Authentication failed. Please try again.',
  trigger_conflict: 'Account setup issue — your profile needs a one-time fix. Contact your administrator.',
}

export function LoginPage() {
  const { user, signIn, loading } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [signingIn, setSigningIn] = useState(false)

  const errorParam = params.get('error')
  const errorMessage = errorParam ? (ERROR_MESSAGES[errorParam] ?? 'Something went wrong. Please try again.') : null

  useEffect(() => {
    if (!loading && user) {
      navigate('/assets', { replace: true })
    }
  }, [user, loading, navigate])

  async function handleSignIn() {
    setSigningIn(true)
    try {
      await signIn()
    } catch {
      setSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <motion.div
        className="card w-full max-w-sm text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-2">
          <img
            src="/cogent-logo.png"
            alt="Cogent"
            className="h-12 w-auto mb-1"
            style={{ filter: 'brightness(0) saturate(100%) invert(26%) sepia(52%) saturate(651%) hue-rotate(172deg) brightness(89%) contrast(96%)' }}
          />
          <span className="text-xl font-bold text-[var(--color-royal-blue)] tracking-wide">ASSETS</span>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] mb-8">Every asset, accounted for</p>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--color-danger-light)] border border-[var(--color-danger)]/20 text-sm text-[var(--color-danger)] text-center">
            {errorMessage}
          </div>
        )}

        <Button
          variant="secondary"
          className="w-full justify-center"
          onClick={handleSignIn}
          loading={signingIn}
        >
          <GoogleIcon />
          Sign in with Google
        </Button>

        <p className="mt-4 text-xs text-[var(--color-text-secondary)]">
          Only @cogentlabs.co admin accounts are permitted
        </p>
      </motion.div>
    </div>
  )
}
