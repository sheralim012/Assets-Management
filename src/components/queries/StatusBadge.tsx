import { motion } from 'framer-motion'
import type { QueryStatus } from '@/types/queries'

const STATUS_STYLES: Record<QueryStatus, { bg: string; text: string; ring: string; dot: string; label: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', dot: 'bg-amber-500', label: 'Pending' },
  in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200', dot: 'bg-blue-500', label: 'In Progress' },
  resolved: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', dot: 'bg-emerald-500', label: 'Resolved' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', dot: 'bg-red-500', label: 'Rejected' },
}

export function StatusBadge({ status }: { status: QueryStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <motion.span
      layout
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${s.bg} ${s.text} ${s.ring}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </motion.span>
  )
}
