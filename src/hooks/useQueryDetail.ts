import { useQuery as useReactQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AssetQuery, QueryComment } from '@/types/queries'

/**
 * Fetch a single query by ID with its comments.
 */
export function useQueryDetail(queryId: string | null) {
  return useReactQuery<AssetQuery>({
    queryKey: ['queries', queryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_queries')
        .select(`
          *,
          employee:profiles!employee_id(id, name, email, avatar_url),
          asset:assets!asset_id(id, asset_tag, manufacturer, specs)
        `)
        .eq('id', queryId!)
        .single()
      if (error) throw error
      return data as unknown as AssetQuery
    },
    enabled: !!queryId,
    staleTime: 0,
  })
}

/**
 * Fetch all comments for a query, ordered oldest first.
 */
export function useQueryComments(queryId: string | null) {
  return useReactQuery<QueryComment[]>({
    queryKey: ['query-comments', queryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('query_comments')
        .select(`
          *,
          author:profiles!author_id(id, name, email, role, avatar_url)
        `)
        .eq('query_id', queryId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as QueryComment[]
    },
    enabled: !!queryId,
    staleTime: 0,
  })
}
