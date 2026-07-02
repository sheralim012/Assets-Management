import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QueryForm } from '@/components/queries/QueryForm'
import { useCreateQuery } from '@/hooks/useQueryMutations'
import { uploadQueryAttachment } from '@/hooks/useQueryAttachments'
import { useAuth } from '@/features/auth/useAuth'
import toast from 'react-hot-toast'

export function NewQueryPage({ basePath = '/employee/queries' }: { basePath?: string }) {
  const navigate = useNavigate()
  const createQuery = useCreateQuery()
  const { profile } = useAuth()

  async function handleSubmit(values: Parameters<typeof createQuery.mutateAsync>[0] & { attachment?: File | null }) {
    try {
      const { attachment, ...queryValues } = values
      const result = await createQuery.mutateAsync(queryValues)

      // Upload attachment if provided
      if (attachment && profile) {
        try {
          await uploadQueryAttachment(attachment, result.id, profile.id)
        } catch {
          toast.error('Query created but image upload failed')
        }
      }

      toast.success('Query submitted successfully')
      navigate(`${basePath}/${result.id}`, { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit query')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <h1 className="text-2xl font-semibold text-gray-900 mb-6 text-center">New Query</h1>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 w-fit min-w-[min(100%,28rem)] mx-auto">
        <QueryForm
          onSubmit={handleSubmit}
          onCancel={() => navigate(basePath)}
          loading={createQuery.isPending}
        />
      </div>
    </motion.div>
  )
}
