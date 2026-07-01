import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/useAuth'

/**
 * Subscribe to realtime notifications for the current user.
 * Invalidates notification and query caches on new inserts.
 * Mount once in AppLayout and once in EmployeeLayout.
 */
export function useRealtimeNotifications() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel(`notif:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'query_notifications',
          filter: `recipient_id=eq.${profile.id}`,
        },
        () => {
          // Invalidate notification caches so bell updates
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          // Invalidate queries list in case status changed
          queryClient.invalidateQueries({ queryKey: ['queries'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, queryClient])
}

/**
 * Subscribe to realtime comment inserts for a specific query.
 * Invalidates the comments cache so the timeline updates live.
 */
export function useRealtimeComments(queryId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!queryId) return

    const channel = supabase
      .channel(`comments:${queryId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'query_comments',
          filter: `query_id=eq.${queryId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['query-comments', queryId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryId, queryClient])
}
