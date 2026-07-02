import { useQuery as useReactQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/useAuth'
import type { AssetQuery, QueryFilters } from '@/types/queries'

/**
 * Fetch queries list. Admins see all; employees see only their own (via RLS).
 */
export function useQueries(filters?: QueryFilters) {
  const { profile } = useAuth()

  return useReactQuery<AssetQuery[]>({
    queryKey: ['queries', profile?.id, filters],
    queryFn: async () => {
      let q = supabase
        .from('asset_queries')
        .select(`
          *,
          employee:profiles!employee_id(id, name, email, avatar_url),
          asset:assets!asset_id(id, asset_tag, manufacturer, specs),
          query_comments(author_id, is_system_message)
        `)
        .order('created_at', { ascending: false })

      if (filters?.status) q = q.eq('status', filters.status)
      if (filters?.priority) q = q.eq('priority', filters.priority)
      if (filters?.query_type) q = q.eq('query_type', filters.query_type)
      if (filters?.employee_id) q = q.eq('employee_id', filters.employee_id)
      if (filters?.search) {
        q = q.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }
      if (filters?.date) {
        q = q.gte('created_at', `${filters.date}T00:00:00`)
          .lt('created_at', `${filters.date}T23:59:59.999`)
      }

      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as unknown as AssetQuery[]
    },
    enabled: !!profile,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })
}
