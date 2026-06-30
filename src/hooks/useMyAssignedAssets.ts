import { useQuery as useReactQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/useAuth'
import type { Asset } from '@/types'

/**
 * Fetch assets allotted to the current employee (non-retired).
 * Used in query forms to pick an asset for issue/fault or support queries.
 */
export function useMyAssignedAssets() {
  const { profile } = useAuth()

  return useReactQuery<Pick<Asset, 'id' | 'asset_tag' | 'asset_type' | 'manufacturer' | 'specs'>[]>({
    queryKey: ['my-assets', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('id, asset_tag, asset_type, manufacturer, specs')
        .eq('allotted_user_id', profile!.id)
        .neq('status', 'retired')
        .order('asset_tag', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    enabled: !!profile,
    staleTime: 60 * 1000,
  })
}
