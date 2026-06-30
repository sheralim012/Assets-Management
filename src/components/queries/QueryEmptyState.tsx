import type { LucideIcon } from 'lucide-react'
import { MessageSquare } from 'lucide-react'

interface QueryEmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: React.ReactNode
}

export function QueryEmptyState({
  icon: Icon = MessageSquare,
  title = 'No queries yet',
  description = 'Click "+ New Query" to report an issue or request a new asset.',
  action,
}: QueryEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">{description}</p>
      {action}
    </div>
  )
}
