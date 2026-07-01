import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QueryForm } from '@/components/queries/QueryForm'
import { useCreateQuery } from '@/hooks/useQueryMutations'
import toast from 'react-hot-toast'

export function NewQueryPage({ basePath = '/employee/queries' }: { basePath?: string }) {
  const navigate = useNavigate()
  const createQuery = useCreateQuery()

  async function handleSubmit(values: Parameters<typeof createQuery.mutateAsync>[0]) {
    try {
      const result = await createQuery.mutateAsync(values)
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
