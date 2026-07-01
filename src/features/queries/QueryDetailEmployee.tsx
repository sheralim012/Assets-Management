import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { StatusBadge } from '@/components/queries/StatusBadge'
import { PriorityBadge } from '@/components/queries/PriorityBadge'
import { QueryTypePill } from '@/components/queries/QueryTypePill'
import { QueryTimeline } from '@/components/queries/QueryTimeline'
import { CommentComposer } from '@/components/queries/CommentComposer'
import { Spinner } from '@/components/ui/Spinner'
import { useQueryDetail, useQueryComments } from '@/hooks/useQueryDetail'
import { useAddComment } from '@/hooks/useQueryMutations'
import { useRealtimeComments } from '@/hooks/useRealtimeNotifications'
import { useAuth } from '@/features/auth/useAuth'
import { ASSET_TYPE_LABELS } from '@/lib/constants'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export function QueryDetailEmployee() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: query, isLoading } = useQueryDetail(id ?? null)
  const { data: comments } = useQueryComments(id ?? null)
  const addComment = useAddComment()
  useRealtimeComments(id ?? null)

  async function handleComment(body: string) {
    if (!id) return
    try {
      await addComment.mutateAsync({ queryId: id, body })
    } catch {
      toast.error('Failed to send message')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" className="text-blue-500" />
      </div>
    )
  }

  if (!query) {
    return (
      <div className="text-center py-20 text-gray-500">
        Query not found.
        <button onClick={() => navigate('/employee/queries')} className="block mt-4 text-blue-600 hover:underline mx-auto">
          Back to My Queries
        </button>
      </div>
    )
  }

  const isTerminal = query.status === 'resolved' || query.status === 'rejected'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Back button */}
      <button
        onClick={() => navigate('/employee/queries')}
        aria-label="Back to queries"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to queries
      </button>

      {/* Header card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900">{query.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Submitted {formatDistanceToNow(new Date(query.created_at), { addSuffix: true })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <QueryTypePill type={query.query_type} />
            <StatusBadge status={query.status} />
            <PriorityBadge priority={query.priority} />
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{query.description}</p>
        </div>

        {/* Asset info */}
        {query.asset && (
          <div className="mt-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-1">
            <p className="text-xs text-gray-500 mb-2">Related Asset</p>
            <p className="text-sm text-gray-700">
              <span className="text-gray-500">Asset Tag:</span>{' '}
              <span className="font-mono font-medium text-blue-600">{query.asset.asset_tag}</span>
            </p>
            <p className="text-sm text-gray-700">
              <span className="text-gray-500">Manufacturer:</span>{' '}
              <span className="font-medium text-gray-900">{ASSET_TYPE_LABELS[query.asset.manufacturer] ?? query.asset.manufacturer}</span>
            </p>
            {query.asset.specs && (
              <p className="text-sm text-gray-700">
                <span className="text-gray-500">Specs:</span>{' '}
                <span className="text-gray-900 break-words">{query.asset.specs}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Timeline + Composer */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Conversation</h2>
        </div>
        <div className="px-5 py-2 max-h-[400px] overflow-y-auto">
          <QueryTimeline comments={comments ?? []} currentUserId={profile?.id ?? null} />
        </div>
        {!isTerminal && (
          <CommentComposer onSubmit={handleComment} loading={addComment.isPending} />
        )}
        {isTerminal && (
          <div className="px-5 py-3 bg-gray-50 text-center text-sm text-gray-500 border-t border-gray-100">
            This query has been {query.status}. No further replies can be added.
          </div>
        )}
      </div>
    </motion.div>
  )
}
