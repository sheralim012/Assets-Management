import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QueryForm } from '@/components/queries/QueryForm'
import { Spinner } from '@/components/ui/Spinner'
import { useQueryDetail } from '@/hooks/useQueryDetail'
import { useUpdateQuery } from '@/hooks/useQueryMutations'
import toast from 'react-hot-toast'

export function EditQueryPage({ basePath = '/employee/queries' }: { basePath?: string }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: query, isLoading } = useQueryDetail(id ?? null)
  const updateQuery = useUpdateQuery()

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

  async function handleSubmit(values: { title: string; description: string; priority: import('@/types/queries').QueryPriority; asset_id: string | null; requested_category_slug: string | null }) {
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
          onSubmit={handleSubmit}
          onCancel={() => navigate(`${basePath}/${id}`)}
          loading={updateQuery.isPending}
          submitLabel="Save Changes"
        />
      </div>
    </motion.div>
  )
}
