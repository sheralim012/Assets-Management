import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { useNotifications, useMarkRead, useMarkAllRead, useUnreadCount } from '@/hooks/useNotifications'
import { useAuth } from '@/features/auth/useAuth'
import { formatDistanceToNow } from 'date-fns'
import type { QueryNotification } from '@/types/queries'

interface Props {
  onClose: () => void
}

export function NotificationList({ onClose }: Props) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { data: notifications, isLoading } = useNotifications()
  const { data: unreadCount } = useUnreadCount()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'

  function handleClick(notification: QueryNotification) {
    // Mark as read
    if (!notification.read_at) {
      markRead.mutate(notification.id)
    }
    // Navigate based on role
    if (isAdmin) {
      navigate('/queries')
    } else {
      navigate(`/employee/queries/${notification.query_id}`)
    }
    onClose()
  }

  function handleMarkAllRead() {
    markAllRead.mutate()
  }

  return (
    <div className="flex flex-col max-h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
        {(unreadCount ?? 0) > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="py-8 text-center text-sm text-gray-400">Loading...</div>
        )}

        {!isLoading && (notifications ?? []).length === 0 && (
          <div className="py-10 text-center">
            <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No notifications</p>
          </div>
        )}

        {!isLoading && (notifications ?? []).map((n) => (
          <NotificationItem key={n.id} notification={n} onClick={() => handleClick(n)} />
        ))}
      </div>
    </div>
  )
}

function NotificationItem({ notification, onClick }: { notification: QueryNotification; onClick: () => void }) {
  const isUnread = !notification.read_at

  const message = getNotificationMessage(notification)

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${
        isUnread ? 'bg-blue-50/40' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        {isUnread && (
          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
        )}
        <div className={`flex-1 min-w-0 ${!isUnread ? 'pl-4' : ''}`}>
          <p className={`text-sm ${isUnread ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
            {message}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </button>
  )
}

function getNotificationMessage(n: QueryNotification): string {
  const queryTitle = n.query?.title ?? 'a query'
  const employeeName = n.query?.employee?.name ?? 'Someone'

  switch (n.notification_type) {
    case 'new_query':
      return `${employeeName} submitted a new query: "${queryTitle}"`
    case 'new_comment':
      return `New reply on "${queryTitle}"`
    case 'status_changed': {
      const newStatus = n.payload?.new_status ?? 'updated'
      return `Query "${queryTitle}" status changed to ${newStatus.replace('_', ' ')}`
    }
    default:
      return `Update on "${queryTitle}"`
  }
}
