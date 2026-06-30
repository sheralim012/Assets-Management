import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Package, HelpCircle, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useMyAssignedAssets } from '@/hooks/useMyAssignedAssets'
import { useEmployeeCategories } from '@/hooks/useEmployeeCategories'
import { PRIORITY_OPTIONS } from '@/lib/queries-constants'
import { ASSET_TYPE_LABELS } from '@/lib/constants'
import type { QueryType, QueryPriority } from '@/types/queries'

interface QueryFormValues {
  query_type: QueryType
  asset_id: string | null
  requested_category_slug: string | null
  title: string
  description: string
  priority: QueryPriority
}

interface QueryFormProps {
  initialValues?: Partial<QueryFormValues>
  onSubmit: (values: QueryFormValues) => Promise<void>
  onCancel: () => void
  loading?: boolean
  submitLabel?: string
}

const TYPE_CARDS: { value: QueryType; label: string; desc: string; icon: typeof AlertTriangle }[] = [
  { value: 'issue_fault', label: 'Issue / Fault', desc: 'Report a problem with an assigned asset', icon: AlertTriangle },
  { value: 'new_asset_request', label: 'New Asset Request', desc: 'Request a new asset to be allocated', icon: Package },
  { value: 'support_other', label: 'Support / Other', desc: 'Ask for help or support with an asset', icon: HelpCircle },
]

export function QueryForm({ initialValues, onSubmit, onCancel, loading = false, submitLabel = 'Submit Query' }: QueryFormProps) {
  const [step, setStep] = useState<1 | 2>(initialValues?.query_type ? 2 : 1)
  const [queryType, setQueryType] = useState<QueryType | null>(initialValues?.query_type ?? null)
  const [assetId, setAssetId] = useState<string | null>(initialValues?.asset_id ?? null)
  const [categorySlug, setCategorySlug] = useState<string | null>(initialValues?.requested_category_slug ?? null)
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [priority, setPriority] = useState<QueryPriority>(initialValues?.priority ?? 'medium')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: myAssets } = useMyAssignedAssets()
  const { data: categories } = useEmployeeCategories()

  const needsAsset = queryType === 'issue_fault' || queryType === 'support_other'
  const needsCategory = queryType === 'new_asset_request'

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    else if (title.trim().length > 100) e.title = 'Title must be 100 characters or less'
    if (!description.trim()) e.description = 'Description is required'
    else if (description.trim().length > 2000) e.description = 'Description must be 2000 characters or less'
    if (needsAsset && !assetId) e.asset_id = 'Please select an asset'
    if (needsCategory && !categorySlug) e.category = 'Please select a category'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!queryType || !validate()) return
    await onSubmit({
      query_type: queryType,
      asset_id: needsAsset ? assetId : null,
      requested_category_slug: needsCategory ? categorySlug : null,
      title: title.trim(),
      description: description.trim(),
      priority,
    })
  }

  function selectType(type: QueryType) {
    setQueryType(type)
    setAssetId(null)
    setCategorySlug(null)
    setErrors({})
    setStep(2)
  }

  const assetOptions = (myAssets ?? []).map((a) => ({
    value: a.id,
    label: `${a.asset_tag} — ${ASSET_TYPE_LABELS[a.asset_type] ?? a.asset_type}`,
  }))

  const categoryOptions = (categories ?? []).map((c) => ({
    value: c.slug,
    label: c.name,
  }))

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait" initial={false}>
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-5">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
              <span className="text-sm font-medium text-gray-500">Step 1 of 2</span>
              <span className="text-sm text-gray-400">— Choose query type</span>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mb-1">What do you need help with?</h2>
            <p className="text-sm text-gray-500 mb-5">Select the type of query that best describes your request.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {TYPE_CARDS.map(({ value, label, desc, icon: Icon }) => (
                <motion.button
                  key={value}
                  whileHover={{ y: -3, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => selectType(value)}
                  className={`
                    p-5 rounded-xl border-2 text-left transition-all
                    hover:border-blue-500
                    ${queryType === value ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-200' : 'border-gray-200 bg-white'}
                  `}
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{label}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
                </motion.button>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <Button variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && queryType && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Step indicator + back button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
                <span className="text-sm font-medium text-gray-500">Step 2 of 2</span>
                <span className="text-sm text-gray-400">— Fill in details</span>
              </div>
              {!initialValues?.query_type && (
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
            </div>

            {/* Selected type chip */}
            {queryType && (
              <div className="flex items-center gap-2 p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                {(() => { const tc = TYPE_CARDS.find(t => t.value === queryType); return tc ? <tc.icon className="w-4 h-4 text-blue-600" /> : null })()}
                <span className="text-sm font-medium text-blue-800">
                  {TYPE_CARDS.find(t => t.value === queryType)?.label}
                </span>
              </div>
            )}

            {needsAsset && (
              <div>
                <Select
                  label="Asset *"
                  options={assetOptions}
                  value={assetId ?? ''}
                  onValueChange={(v) => { setAssetId(v || null); setErrors((e) => ({ ...e, asset_id: '' })) }}
                  placeholder="Select an asset..."
                  error={errors.asset_id}
                />
                {assetOptions.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    You have no assets assigned. Contact an admin if this seems wrong.
                  </p>
                )}
              </div>
            )}

            {needsCategory && (
              <Select
                label="Asset Category *"
                options={categoryOptions}
                value={categorySlug ?? ''}
                onValueChange={(v) => { setCategorySlug(v || null); setErrors((e) => ({ ...e, category: '' })) }}
                placeholder="Select a category..."
                error={errors.category}
              />
            )}

            <Input
              label="Title *"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((er) => ({ ...er, title: '' })) }}
              placeholder="Brief summary of your query"
              maxLength={100}
              error={errors.title}
            />

            <Textarea
              label="Description *"
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrors((er) => ({ ...er, description: '' })) }}
              placeholder="Provide details — what happened, when, any relevant context"
              rows={4}
              maxLength={2000}
              error={errors.description}
            />
            <p className="text-xs text-gray-400 -mt-2 text-right">{description.length}/2000</p>

            <Select
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={priority}
              onValueChange={(v) => setPriority(v as QueryPriority)}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit} loading={loading}>
                {submitLabel}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
