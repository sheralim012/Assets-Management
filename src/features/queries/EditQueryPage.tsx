import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QueryForm } from '@/components/queries/QueryForm'
import { Spinner } from '@/components/ui/Spinner'
import { useQueryDetail } from '@/hooks/useQueryDetail'
import { useUpdateQuery } from '@/hooks/useQueryMutations'
import { useQueryAttachments, uploadQueryAttachment, deleteQueryAttachment, getQueryAttachmentUrl } from '@/hooks/useQueryAttachments'
import { useAuth } from '@/features/auth/useAuth'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export function EditQueryPage({ basePath = '/employee/queries' }: { basePath?: string }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: query, isLoading } = useQueryDetail(id ?? null)
  const updateQuery = useUpdateQuery()
  const { data: attachments } = useQueryAttachments(id ?? null)
  const [existingUrl, setExistingUrl] = useState<string | null>(null)

  const existingAttachment = attachments?.[0] ?? null

  useEffect(() => {
    if (existingAttachment && !existingUrl) {
      getQueryAttachmentUrl(existingAttachment.storage_path).then(setExistingUrl)
    }
  }, [existingAttachment]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" className="text-blue-500" />
      </div>
    )
  }

  if (!query) {
    return (
      <div className="text-center py-20 text-gray-500">
        Query not found.
      </div>
    )
  }

  if (query.status !== 'pending') {
    navigate(`${basePath}/${id}`, { replace: true })
    return null
  }

  async function handleSubmit(values: { title: string; description: string; priority: import('@/types/queries').QueryPriority; asset_id: string | null; requested_category_slug: string | null; attachment?: File | null; removeExistingAttachment?: boolean }) {
    if (!id) return
    try {
      await updateQuery.mutateAsync({
        id,
        title: values.title,
        description: values.description,
        priority: values.priority,
        asset_id: values.asset_id,
        requested_category_slug: values.requested_category_slug,
      })

      if (values.removeExistingAttachment && existingAttachment) {
        try {
          await deleteQueryAttachment(existingAttachment)
        } catch {
          toast.error('Failed to remove old attachment')
        }
      }

      if (values.attachment && profile) {
        if (existingAttachment && !values.removeExistingAttachment) {
          try {
            await deleteQueryAttachment(existingAttachment)
          } catch { /* ignore */ }
        }
        try {
          await uploadQueryAttachment(values.attachment, id, profile.id)
        } catch {
          toast.error('Query updated but image upload failed')
        }
      }

      toast.success('Query updated')
      navigate(`${basePath}/${id}`, { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update query')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Edit Query</h1>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <QueryForm
          initialValues={{
            query_type: query.query_type,
            asset_id: query.asset_id,
            requested_category_slug: query.requested_category_slug,
            title: query.title,
            description: query.description,
            priority: query.priority,
          }}
          existingAttachmentUrl={existingUrl}
          existingAttachmentName={existingAttachment?.file_name}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`${basePath}/${id}`)}
          loading={updateQuery.isPending}
          submitLabel="Save Changes"
        />
      </div>
    </motion.div>
  )
}
