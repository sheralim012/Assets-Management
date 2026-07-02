import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface QueryAttachment {
  id: string
  query_id: string
  file_name: string
  file_size: number
  file_type: string
  storage_path: string
  uploaded_by: string
  created_at: string
}

const BUCKET = 'query-attachments'

export function useQueryAttachments(queryId: string | null) {
  return useQuery<QueryAttachment[]>({
    queryKey: ['query-attachments', queryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('query_attachments')
        .select('*')
        .eq('query_id', queryId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!queryId,
    staleTime: 30_000,
  })
}

export async function uploadQueryAttachment(
  file: File,
  queryId: string,
  uploadedBy: string,
): Promise<QueryAttachment> {
  const sanitized = file.name.replace(/[^\w.\-]/g, '_')
  const storagePath = `${queryId}/${Date.now()}-${sanitized}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file)
  if (uploadError) throw uploadError

  const { data, error: dbError } = await supabase
    .from('query_attachments')
    .insert({
      query_id: queryId,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type || 'image/jpeg',
      storage_path: storagePath,
      uploaded_by: uploadedBy,
    })
    .select()
    .single()
  if (dbError) {
    // Rollback storage on DB error
    await supabase.storage.from(BUCKET).remove([storagePath])
    throw dbError
  }

  return data as QueryAttachment
}

export async function deleteQueryAttachment(attachment: QueryAttachment): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([attachment.storage_path])
  if (storageError) throw storageError

  const { error: dbError } = await supabase
    .from('query_attachments')
    .delete()
    .eq('id', attachment.id)
  if (dbError) throw dbError
}

export async function deleteAllQueryAttachments(queryId: string): Promise<void> {
  const { data: attachments } = await supabase
    .from('query_attachments')
    .select('id, storage_path')
    .eq('query_id', queryId)

  if (attachments && attachments.length > 0) {
    await supabase.storage
      .from(BUCKET)
      .remove(attachments.map((a) => a.storage_path))
    await supabase
      .from('query_attachments')
      .delete()
      .in('id', attachments.map((a) => a.id))
  }
}

export async function getQueryAttachmentUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600)
  return data?.signedUrl ?? null
}
