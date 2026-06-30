import { motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'

export function EmployeeQueriesPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Queries</h1>
      </div>
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-1">No queries yet</h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          This page is coming soon. You'll be able to report issues, request new assets, and track your queries here.
        </p>
      </div>
    </motion.div>
  )
}
