import { useQuery as useReactQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/useAuth'
import type { QueryNotification } from '@/types/queries'

/**
 * Fetch notifications for the current user, newest first (last 50).
 */
export function useNotifications() {
  const { profile } = useAuth()

  return useReactQuery<QueryNotification[]>({
    queryKey: ['notifications', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('query_notifications')
        .select(`
          *,
          query:asset_queries!query_id(title, employee:profiles!employee_id(name))
        `)
        .eq('recipient_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return (data ?? []) as unknown as QueryNotification[]
    },
    enabled: !!profile,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })
}

/**
 * Unread notification count for the current user.
 */
export function useUnreadCount() {
  const { profile } = useAuth()

  return useReactQuery<number>({
    queryKey: ['notifications', 'unread-count', profile?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('query_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', profile!.id)
        .is('read_at', null)

      if (error) throw error
      return count ?? 0
    },
    enabled: !!profile,
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  })
}

/**
 * Mark a single notification as read.
 */
export function useMarkRead() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('query_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/**
 * Mark all notifications as read for the current user.
 */
export function useMarkAllRead() {
  const qc = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async () => {
      if (!profile) return
      const { error } = await supabase
        .from('query_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', profile.id)
        .is('read_at', null)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
