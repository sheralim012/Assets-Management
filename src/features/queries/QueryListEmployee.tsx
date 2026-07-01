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

interface QueryListEmployeeProps {
  basePath?: string
  /** When set, filters queries to only this user's queries */
  userId?: string
  title?: string
  subtitle?: string
}

export function QueryListEmployee({
  basePath = '/employee/queries',
  userId,
  title = 'My Queries',
  subtitle = 'Track and manage your submitted queries',
}: QueryListEmployeeProps) {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<QueryStatus | 'all'>('all')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AssetQuery | null>(null)

  const { data: queries, isLoading } = useQueries(
    {
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(userId ? { employee_id: userId } : {}),
    },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">{title}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {subtitle}
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate(`${basePath}/new`)} className="self-start sm:self-auto flex-shrink-0">
          <Plus className="w-4 h-4" />
          New Query
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
              ${statusFilter === tab.value
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'bg-white text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl border border-[var(--color-border)] p-5">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="flex gap-2">
                <div className="h-6 bg-gray-100 rounded-full w-24" />
                <div className="h-6 bg-gray-100 rounded-full w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (queries ?? []).length === 0 && (
        <QueryEmptyState
          action={
            <Button variant="primary" onClick={() => navigate(`${basePath}/new`)}>
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
              onClick={() => navigate(`${basePath}/${query.id}`)}
              className="bg-white rounded-xl border border-[var(--color-border)] p-5 cursor-pointer shadow-[var(--shadow-card)] hover:shadow-md hover:border-[var(--color-primary)]/20 transition-all relative"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--color-text)] truncate">{query.title}</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 line-clamp-2">{query.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <QueryTypePill type={query.query_type} />
                    <StatusBadge status={query.status} />
                    <PriorityBadge priority={query.priority} />
                  </div>
                  <div className="flex items-center gap-3 mt-2.5 text-xs text-[var(--color-text-secondary)]">
                    {query.asset && (
                      <span className="font-mono text-[var(--color-primary)]">{query.asset.asset_tag}</span>
                    )}
                    <span>{formatDistanceToNow(new Date(query.created_at), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Three-dot menu */}
                {canEditDelete(query) && (
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === query.id ? null : query.id) }}
                      className="p-1.5 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                      aria-label="More actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpen === query.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuOpen(null) }} />
                        <div className="absolute right-0 top-8 z-50 w-36 bg-white rounded-xl shadow-[var(--shadow-dropdown)] ring-1 ring-[var(--color-border)] py-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(null); navigate(`${basePath}/${query.id}/edit`) }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(null); setDeleteTarget(query) }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-light)]"
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
