import { useState } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { StatusBadge } from '@/components/queries/StatusBadge'
import { PriorityBadge } from '@/components/queries/PriorityBadge'
import { QueryTypePill } from '@/components/queries/QueryTypePill'
import { QueryTimeline } from '@/components/queries/QueryTimeline'
import { CommentComposer } from '@/components/queries/CommentComposer'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { useQueryDetail, useQueryComments } from '@/hooks/useQueryDetail'
import { useChangeQueryStatus, useAddComment } from '@/hooks/useQueryMutations'
import { useRealtimeComments } from '@/hooks/useRealtimeNotifications'
import { useAuth } from '@/features/auth/useAuth'
import { ASSET_TYPE_LABELS } from '@/lib/constants'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import type { QueryStatus } from '@/types/queries'

interface Props {
  queryId: string | null
  onClose: () => void
}

const STATUS_TRANSITIONS: { value: QueryStatus; label: string }[] = [
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
]

export function QueryDetailAdminDrawer({ queryId, onClose }: Props) {
  const { profile } = useAuth()
  const { data: query, isLoading } = useQueryDetail(queryId)
  const { data: comments } = useQueryComments(queryId)
  const changeStatus = useChangeQueryStatus()
  const addComment = useAddComment()
  useRealtimeComments(queryId)

  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const isTerminal = query?.status === 'resolved' || query?.status === 'rejected'

  async function handleStatusChange(newStatus: QueryStatus) {
    if (!queryId) return

    if (newStatus === 'rejected') {
      setRejectModalOpen(true)
      setStatusMenuOpen(false)
      return
    }

    try {
      await changeStatus.mutateAsync({ queryId, status: newStatus })
      toast.success(`Status changed to ${newStatus.replace('_', ' ')}`)
      setStatusMenuOpen(false)
    } catch {
      toast.error('Failed to change status')
    }
  }

  async function handleRejectConfirm() {
    if (!queryId || !rejectReason.trim()) return
    try {
      // Post reason as a comment first, then change status
      await addComment.mutateAsync({ queryId, body: `Rejection reason: ${rejectReason.trim()}` })
      await changeStatus.mutateAsync({ queryId, status: 'rejected' })
      toast.success('Query rejected')
      setRejectModalOpen(false)
      setRejectReason('')
    } catch {
      toast.error('Failed to reject query')
    }
  }

  async function handleComment(body: string) {
    if (!queryId) return
    try {
      await addComment.mutateAsync({ queryId, body })
    } catch {
      toast.error('Failed to send message')
    }
  }

  return (
    <>
      <Drawer open={!!queryId} onClose={onClose} title="Query Details" width={560}>
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" className="text-blue-500" />
          </div>
        )}

        {!isLoading && !query && (
          <div className="text-center py-20 text-gray-500">Query not found.</div>
        )}

        {!isLoading && query && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{query.title}</h3>

              {/* Employee info */}
              <div className="flex items-center gap-2 mb-3">
                <Avatar
                  src={query.employee?.avatar_url ?? null}
                  name={query.employee?.name ?? 'Unknown'}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">{query.employee?.name}</p>
                  <p className="text-xs text-gray-400">{query.employee?.email}</p>
                </div>
                <span className="text-xs text-gray-400 ml-auto">
                  {formatDistanceToNow(new Date(query.created_at), { addSuffix: true })}
                </span>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <QueryTypePill type={query.query_type} />
                <PriorityBadge priority={query.priority} />
                <StatusBadge status={query.status} />
              </div>

              {/* Status change dropdown */}
              {!isTerminal && (
                <div className="relative inline-block">
                  <button
                    onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 shadow-sm transition-all"
                  >
                    Change Status
                    <svg className={`w-3.5 h-3.5 transition-transform ${statusMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {statusMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setStatusMenuOpen(false)} />
                      <div className="absolute left-0 top-10 z-50 w-44 bg-white rounded-xl shadow-[var(--shadow-dropdown)] ring-1 ring-[var(--color-border)] py-1">
                        {STATUS_TRANSITIONS
                          .filter((s) => s.value !== query.status)
                          .map((s) => (
                            <button
                              key={s.value}
                              onClick={() => handleStatusChange(s.value)}
                              disabled={changeStatus.isPending}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                s.value === 'rejected' ? 'text-[var(--color-danger)]' : 'text-gray-700'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
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

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto px-5 py-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Conversation</h4>
              <QueryTimeline comments={comments ?? []} currentUserId={profile?.id ?? null} />
            </div>

            {/* Composer or terminal message */}
            {!isTerminal ? (
              <CommentComposer onSubmit={handleComment} loading={addComment.isPending} />
            ) : (
              <div className="px-5 py-3 bg-gray-50 text-center text-sm text-gray-500 border-t border-gray-100">
                This query has been {query.status}. No further replies can be added.
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Reject reason modal */}
      <Modal
        open={rejectModalOpen}
        onClose={() => { setRejectModalOpen(false); setRejectReason('') }}
        title="Reject Query"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setRejectModalOpen(false); setRejectReason('') }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectConfirm}
              loading={changeStatus.isPending || addComment.isPending}
              disabled={!rejectReason.trim()}
            >
              Reject Query
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 mb-3">
          Please provide a reason for rejecting this query. The employee will see this reason.
        </p>
        <Textarea
          label="Rejection Reason *"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Explain why this query is being rejected..."
          rows={3}
          maxLength={500}
        />
      </Modal>
    </>
  )
}
