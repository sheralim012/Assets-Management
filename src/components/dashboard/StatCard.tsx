import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: LucideIcon
  iconColor?: string
  iconBg?: string
  accent?: boolean
  className?: string
}

export function StatCard({ label, value, sub, icon: Icon, iconColor, iconBg, accent, className }: StatCardProps) {
  return (
    <div className={cn('card p-5 flex items-start gap-4', className)}>
      {Icon && (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: iconBg ?? 'var(--color-primary-light)' }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor ?? 'var(--color-primary)' }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide leading-none mb-1.5">
          {label}
        </p>
        <p className={cn(
          'text-2xl font-bold leading-none',
          accent ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
        )}>
          {value}
        </p>
        {sub && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">{sub}</p>
        )}
      </div>
    </div>
  )
}
