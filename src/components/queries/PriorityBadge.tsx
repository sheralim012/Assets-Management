import type { QueryPriority } from '@/types/queries'

const PRIORITY_STYLES: Record<QueryPriority, { bg: string; text: string; ring: string; label: string }> = {
  low: { bg: 'bg-gray-50', text: 'text-gray-700', ring: 'ring-gray-200', label: 'Low' },
  medium: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200', label: 'Medium' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', label: 'High' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', label: 'Critical' },
}

export function PriorityBadge({ priority }: { priority: QueryPriority }) {
  const s = PRIORITY_STYLES[priority]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ring-1 ${s.bg} ${s.text} ${s.ring}`}>
      {s.label}
    </span>
  )
}
