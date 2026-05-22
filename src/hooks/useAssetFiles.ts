import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AssetFile } from '@/types'

export function useAssetFiles(assetId: string | null) {
  const qc = useQueryClient()

  const query = useQuery<AssetFile[]>({
    queryKey: ['asset-files', assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_files')
        .select('*')
        .eq('asset_id', assetId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!assetId,
    staleTime: 0,
  })

  async function getSignedUrl(storagePath: string): Promise<string | null> {
    const { data } = await supabase.storage
      .from('asset-files')
      .createSignedUrl(storagePath, 3600)
    return data?.signedUrl ?? null
  }

  const deleteMutation = useMutation({
    mutationFn: async ({ fileId, storagePath }: { fileId: string; storagePath: string }) => {
      const { error: storageError } = await supabase.storage
        .from('asset-files')
        .remove([storagePath])
      if (storageError) throw storageError
      const { error: dbError } = await supabase
        .from('asset_files')
        .delete()
        .eq('id', fileId)
      if (dbError) throw dbError
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-files', assetId] })
      qc.invalidateQueries({ queryKey: ['asset-file-counts'] })
    },
  })

  return {
    files: query.data ?? [],
    isLoading: query.isLoading,
    getSignedUrl,
    deleteFile: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}

export function useAssetFileCounts(assetIds: string[]) {
  return useQuery<Record<string, number>>({
    queryKey: ['asset-file-counts', assetIds],
    queryFn: async () => {
      if (assetIds.length === 0) return {}
      const { data, error } = await supabase
        .from('asset_files')
        .select('asset_id')
        .in('asset_id', assetIds)
      if (error) throw error
      const counts: Record<string, number> = {}
      for (const row of data ?? []) {
        counts[row.asset_id] = (counts[row.asset_id] ?? 0) + 1
      }
      return counts
    },
    enabled: assetIds.length > 0,
    staleTime: 30 * 1000,
  })
}
