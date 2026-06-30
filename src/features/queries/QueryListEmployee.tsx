import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/queries/StatusBadge'
import { PriorityBadge } from '@/components/queries/PriorityBadge'
import { QueryTypePill } from '@/components/queries/QueryTypePill'
import { QueryEmptyState } from '@/components/queries/QueryEmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useQueries } from '@/hooks/useQueries'
import { useDeleteQuery } from '@/hooks/useQueryMutations'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import type { QueryStatus, AssetQuery } from '@/types/queries'

const FILTER_TABS: { value: QueryStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
]

export function QueryListEmployee() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<QueryStatus | 'all'>('all')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AssetQuery | null>(null)

  const { data: queries, isLoading } = useQueries(
    statusFilter === 'all' ? undefined : { status: statusFilter },
  )
  const deleteQuery = useDeleteQuery()

  function canEditDelete(query: AssetQuery): boolean {
    return query.status === 'pending'
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteQuery.mutateAsync(deleteTarget.id)
      toast.success('Query deleted')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete query')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Queries</h1>
        <Button variant="primary" onClick={() => navigate('/employee/queries/new')}>
          <Plus className="w-4 h-4" />
          New Query
        </Button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
              ${statusFilter === tab.value
                ? 'bg-slate-900 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg border border-gray-200 p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (queries ?? []).length === 0 && (
        <QueryEmptyState
          action={
            <Button variant="primary" onClick={() => navigate('/employee/queries/new')}>
              <Plus className="w-4 h-4" />
              New Query
            </Button>
          }
        />
      )}

      {/* Query cards */}
      {!isLoading && (queries ?? []).length > 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          className="space-y-3"
        >
          {(queries ?? []).map((query) => (
            <motion.div
              key={query.id}
              variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } }}
              whileHover={{ y: -1 }}
              transition={{ duration: 0.15 }}
              onClick={() => navigate(`/employee/queries/${query.id}`)}
              className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer shadow-sm hover:shadow-md transition-shadow relative"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{query.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{query.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <QueryTypePill type={query.query_type} />
                    <StatusBadge status={query.status} />
                    <PriorityBadge priority={query.priority} />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    {query.asset && (
                      <span className="font-mono text-gray-500">{query.asset.asset_tag}</span>
                    )}
                    <span>{formatDistanceToNow(new Date(query.created_at), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Three-dot menu */}
                {canEditDelete(query) && (
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === query.id ? null : query.id) }}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="More actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpen === query.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuOpen(null) }} />
                        <div className="absolute right-0 top-8 z-50 w-36 bg-white rounded-lg shadow-lg ring-1 ring-gray-200 py-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(null); navigate(`/employee/queries/${query.id}/edit`) }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(null); setDeleteTarget(query) }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete Query"
          description={`Are you sure you want to delete "${deleteTarget.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          loading={deleteQuery.isPending}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </motion.div>
  )
}
