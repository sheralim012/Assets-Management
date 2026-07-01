import type { QueryPriority } from '@/types/queries'

const PRIORITY_STYLES: Record<QueryPriority, { bg: string; text: string; ring: string; label: string }> = {
  low: { bg: 'bg-slate-50', text: 'text-slate-600', ring: 'ring-slate-200/60', label: 'Low' },
  medium: { bg: 'bg-[var(--color-primary-light)]', text: 'text-[var(--color-primary)]', ring: 'ring-[var(--color-primary)]/15', label: 'Medium' },
  high: { bg: 'bg-amber-50', text: 'text-amber-800', ring: 'ring-amber-200/60', label: 'High' },
  critical: { bg: 'bg-[var(--color-danger-light)]', text: 'text-[var(--color-danger)]', ring: 'ring-[var(--color-danger)]/15', label: 'Critical' },
}

export function PriorityBadge({ priority }: { priority: QueryPriority }) {
  const s = PRIORITY_STYLES[priority]
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${s.bg} ${s.text} ${s.ring}`}>
      {s.label}
    </span>
  )
}
