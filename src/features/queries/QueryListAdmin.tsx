import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/queries/StatusBadge'
import { PriorityBadge } from '@/components/queries/PriorityBadge'
import { QueryTypePill } from '@/components/queries/QueryTypePill'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { QueryDetailAdminDrawer } from './QueryDetailAdminDrawer'
import { useQueries } from '@/hooks/useQueries'
import { STATUS_OPTIONS, PRIORITY_OPTIONS, QUERY_TYPE_OPTIONS } from '@/lib/queries-constants'
import { formatDistanceToNow } from 'date-fns'
import type { QueryStatus, QueryPriority, QueryType, AssetQuery } from '@/types/queries'

export function QueryListAdmin() {
  const [search, setSearch] = useState('')
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<QueryStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<QueryPriority | ''>('')
  const [typeFilter, setTypeFilter] = useState<QueryType | ''>('')

  const { data: queries, isLoading } = useQueries({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    query_type: typeFilter || undefined,
    search: search || undefined,
  })

  const sorted = useMemo(() => {
    if (!queries) return []
    return [...queries].sort((a, b) => {
      // Pending/in_progress first, then by date desc
      const aActive = a.status === 'pending' || a.status === 'in_progress' ? 0 : 1
      const bActive = b.status === 'pending' || b.status === 'in_progress' ? 0 : 1
      if (aActive !== bActive) return aActive - bActive
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [queries])

  const hasFilters = !!search || !!statusFilter || !!priorityFilter || !!typeFilter

  function clearFilters() {
    setSearch('')
    setStatusFilter('')
    setPriorityFilter('')
    setTypeFilter('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <PageHeader
        title="Employee Queries"
        description={`${sorted.length} ${sorted.length === 1 ? 'query' : 'queries'} total`}
      />

      {/* Filters */}
      <div className="bg-white rounded-lg border border-[var(--color-border)] shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by title..."
            className="lg:col-span-2"
          />
          <Select
            options={[{ value: '__all__', label: 'All Statuses' }, ...STATUS_OPTIONS]}
            value={statusFilter || '__all__'}
            onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v as QueryStatus)}
            placeholder="Status"
          />
          <Select
            options={[{ value: '__all__', label: 'All Priorities' }, ...PRIORITY_OPTIONS]}
            value={priorityFilter || '__all__'}
            onValueChange={(v) => setPriorityFilter(v === '__all__' ? '' : v as QueryPriority)}
            placeholder="Priority"
          />
          <Select
            options={[{ value: '__all__', label: 'All Types' }, ...QUERY_TYPE_OPTIONS]}
            value={typeFilter || '__all__'}
            onValueChange={(v) => setTypeFilter(v === '__all__' ? '' : v as QueryType)}
            placeholder="Type"
          />
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-blue-600 hover:text-blue-700 mt-2"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" className="text-blue-500" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sorted.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title={hasFilters ? 'No queries match your filters' : 'No queries yet'}
          description={hasFilters ? 'Try adjusting your filters to see more results.' : 'Employee queries will appear here once submitted.'}
          actionLabel={hasFilters ? 'Clear filters' : undefined}
          onAction={hasFilters ? clearFilters : undefined}
        />
      )}

      {/* Table */}
      {!isLoading && sorted.length > 0 && (
        <div className="bg-white rounded-lg border border-[var(--color-border)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)]">Employee</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)]">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)]">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)]">Asset</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)]">Priority</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-text-secondary)]">Created</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((query, idx) => (
                  <QueryRow key={query.id} query={query} even={idx % 2 === 0} onClick={() => setSelectedQueryId(query.id)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Detail drawer */}
      <QueryDetailAdminDrawer
        queryId={selectedQueryId}
        onClose={() => setSelectedQueryId(null)}
      />
    </motion.div>
  )
}

function QueryRow({ query, even, onClick }: { query: AssetQuery; even: boolean; onClick: () => void }) {
  const isActive = query.status === 'pending' || query.status === 'in_progress'

  return (
    <tr
      onClick={onClick}
      className={`
        border-b border-[var(--color-border)] last:border-0 cursor-pointer transition-colors
        hover:bg-blue-50/50
        ${even ? 'bg-white' : 'bg-[var(--color-bg)]'}
      `}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
          )}
          <Avatar
            src={query.employee?.avatar_url ?? null}
            name={query.employee?.name ?? 'Unknown'}
            size="sm"
          />
          <div className="min-w-0">
            <p className={`truncate ${isActive ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
              {query.employee?.name ?? 'Unknown'}
            </p>
            <p className="text-xs text-gray-400 truncate">{query.employee?.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <QueryTypePill type={query.query_type} />
      </td>
      <td className="px-4 py-3">
        <p className={`truncate max-w-[250px] ${isActive ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
          {query.title}
        </p>
      </td>
      <td className="px-4 py-3">
        {query.asset ? (
          <span className="font-mono text-xs text-blue-600">{query.asset.asset_tag}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <PriorityBadge priority={query.priority} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={query.status} />
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
        {formatDistanceToNow(new Date(query.created_at), { addSuffix: true })}
      </td>
    </tr>
  )
}
