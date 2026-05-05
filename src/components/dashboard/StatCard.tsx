import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  className?: string
}

export function StatCard({ label, value, sub, accent, className }: StatCardProps) {
  return (
    <div className={cn('card p-5 flex flex-col gap-1', className)}>
      <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
        {label}
      </p>
      <p className={cn(
        'text-3xl font-bold leading-none mt-1',
        accent ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
      )}>
        {value}
      </p>
      {sub && (
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{sub}</p>
      )}
    </div>
  )
}
