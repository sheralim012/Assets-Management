import { AlertTriangle, Package, HelpCircle } from 'lucide-react'
import type { QueryType } from '@/types/queries'

const TYPE_CONFIG: Record<QueryType, { icon: typeof AlertTriangle; label: string; className: string }> = {
  issue_fault: {
    icon: AlertTriangle,
    label: 'Issue/Support',
    className: 'bg-amber-50 text-amber-800 ring-amber-200',
  },
  new_asset_request: {
    icon: Package,
    label: 'New Asset Request',
    className: 'bg-[var(--color-primary-light)] text-[var(--color-primary)] ring-[var(--color-primary)]/20',
  },
  support_other: {
    icon: HelpCircle,
    label: 'Support / Other',
    className: 'bg-gray-50 text-gray-600 ring-gray-200',
  },
}

export function QueryTypePill({ type }: { type: QueryType }) {
  const config = TYPE_CONFIG[type]
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${config.className}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  )
}
