import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Activity, CirclePlus } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { format } from 'date-fns'
import type { QueryComment } from '@/types/queries'

interface QueryTimelineProps {
  comments: QueryComment[]
  currentUserId: string | null
}

export function QueryTimeline({ comments, currentUserId }: QueryTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        No messages yet. Start the conversation below.
      </div>
    )
  }

  return (
    <div className="relative space-y-0" aria-live="polite" aria-label="Conversation timeline">
      {/* Vertical connecting line */}
      <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />

      {comments.map((comment, index) => (
        <motion.div
          key={comment.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: index * 0.05 }}
          className="relative pl-10 py-3"
        >
          {/* Timeline dot */}
          <div className="absolute left-[11px] top-[22px] w-2.5 h-2.5 rounded-full border-2 border-white bg-gray-300 z-10" />

          {comment.is_system_message ? (
            <SystemMessage comment={comment} />
          ) : (
            <UserMessage comment={comment} isOwn={comment.author_id === currentUserId} />
          )}
        </motion.div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

function SystemMessage({ comment }: { comment: QueryComment }) {
  const isStatusChange = comment.body.startsWith('Status changed:')
  const isCreated = comment.body.toLowerCase().includes('created')
  const Icon = isStatusChange ? Activity : isCreated ? CirclePlus : Activity

  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm italic text-gray-500">{comment.body}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {comment.author?.name && `by ${comment.author.name} · `}
          {format(new Date(comment.created_at), 'dd MMM yyyy, hh:mm a')}
        </p>
      </div>
    </div>
  )
}

function UserMessage({ comment, isOwn }: { comment: QueryComment; isOwn: boolean }) {
  const isAdmin = comment.author?.role === 'admin'
  const bgColor = isOwn ? 'bg-blue-50' : 'bg-gray-50'

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <Avatar
          src={comment.author?.avatar_url ?? null}
          name={comment.author?.name ?? 'User'}
          size="xs"
        />
        <span className="text-sm font-medium text-gray-900">
          {comment.author?.name ?? 'Unknown'}
        </span>
        {isAdmin && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
            Admin
          </span>
        )}
        <span className="text-xs text-gray-400">
          {format(new Date(comment.created_at), 'dd MMM yyyy, hh:mm a')}
        </span>
      </div>
      <div className={`rounded-lg p-3 ${bgColor}`}>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.body}</p>
      </div>
    </div>
  )
}
