import { AlertTriangle, Package, HelpCircle } from 'lucide-react'
import type { QueryType } from '@/types/queries'

const TYPE_CONFIG: Record<QueryType, { icon: typeof AlertTriangle; label: string; className: string }> = {
  issue_fault: {
    icon: AlertTriangle,
    label: 'Issue / Fault',
    className: 'bg-red-50 text-red-700 ring-red-200',
  },
  new_asset_request: {
    icon: Package,
    label: 'New Asset Request',
    className: 'bg-blue-50 text-blue-700 ring-blue-200',
  },
  support_other: {
    icon: HelpCircle,
    label: 'Support / Other',
    className: 'bg-gray-50 text-gray-700 ring-gray-200',
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
