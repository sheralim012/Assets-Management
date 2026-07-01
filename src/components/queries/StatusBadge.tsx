import { motion } from 'framer-motion'
import type { QueryStatus } from '@/types/queries'

const STATUS_STYLES: Record<QueryStatus, { bg: string; text: string; ring: string; dot: string; label: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-800', ring: 'ring-amber-200/60', dot: 'bg-amber-500', label: 'Pending' },
  in_progress: { bg: 'bg-[var(--color-primary-light)]', text: 'text-[var(--color-primary)]', ring: 'ring-[var(--color-primary)]/15', dot: 'bg-[var(--color-royal-blue)]', label: 'In Progress' },
  resolved: { bg: 'bg-[var(--color-available-light)]', text: 'text-[var(--color-available)]', ring: 'ring-[var(--color-available)]/15', dot: 'bg-[var(--color-available)]', label: 'Resolved' },
  rejected: { bg: 'bg-[var(--color-danger-light)]', text: 'text-[var(--color-danger)]', ring: 'ring-[var(--color-danger)]/15', dot: 'bg-[var(--color-danger)]', label: 'Rejected' },
}

export function StatusBadge({ status }: { status: QueryStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <motion.span
      layout
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${s.bg} ${s.text} ${s.ring}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </motion.span>
  )
}
