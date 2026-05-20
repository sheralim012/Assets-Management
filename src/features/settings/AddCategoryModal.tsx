import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Search } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAddCategory } from '@/hooks/useCategories'
import { CATEGORY_ICON_OPTIONS } from './categoryIcons'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  tag_prefix: z.string().max(8, 'Max 8 characters'),
})
type FormValues = z.infer<typeof schema>

interface AddCategoryModalProps {
  open: boolean
  onClose: () => void
  classification: 'employee_allocated' | 'company_allocated'
  nextSortOrder: number
}

export function AddCategoryModal({ open, onClose, classification, nextSortOrder }: AddCategoryModalProps) {
  const addCategory = useAddCategory()
  const [selectedIcon, setSelectedIcon] = useState('Package')
  const [iconQuery, setIconQuery] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', tag_prefix: '' },
  })

  const tagPrefixVal = watch('tag_prefix')

  const filteredIcons = useMemo(() => {
    const q = iconQuery.trim().toLowerCase()
    if (!q) return CATEGORY_ICON_OPTIONS
    return CATEGORY_ICON_OPTIONS.filter((opt) =>
      opt.name.toLowerCase().includes(q) ||
      (opt.keywords ?? '').toLowerCase().includes(q)
    )
  }, [iconQuery])

  function handleClose() {
    reset()
    setSelectedIcon('Package')
    setIconQuery('')
    onClose()
  }

  async function onSubmit(values: FormValues) {
    try {
      await addCategory.mutateAsync({
        name: values.name.trim(),
        classification,
        icon: selectedIcon,
        sort_order: nextSortOrder,
        tag_prefix: values.tag_prefix.trim() ? values.tag_prefix.trim().toUpperCase() : null,
      })
      toast.success(`${values.name} category added`)
      handleClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add category')
    }
  }

  const classLabel = classification === 'employee_allocated' ? 'Employee Assets' : 'Company Assets'

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Category"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={addCategory.isPending}>
            Add Category
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg)] rounded-lg text-sm">
          <span className="text-[var(--color-text-secondary)]">Classification:</span>
          <span className="font-medium text-[var(--color-text)]">{classLabel}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Display Name *"
            placeholder="e.g. Tablet"
            {...register('name')}
            error={errors.name?.message}
          />
          <div>
            <Input
              label="Tag Prefix"
              placeholder="e.g. LT, MP, CLED"
              {...register('tag_prefix', {
                setValueAs: (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, ''),
              })}
              error={errors.tag_prefix?.message}
            />
            {tagPrefixVal ? (
              <p className="mt-1 text-[10px] text-[var(--color-text-secondary)]">
                Preview: <span className="font-mono font-semibold">{tagPrefixVal.toUpperCase()}-0001</span>
              </p>
            ) : (
              <p className="mt-1 text-[10px] text-[var(--color-text-secondary)]">
                Leave blank if assets have mixed or non-standard tags
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[var(--color-text)]">Icon *</p>
            <span className="text-xs text-[var(--color-text-secondary)]">{filteredIcons.length} icons</span>
          </div>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={iconQuery}
              onChange={(e) => setIconQuery(e.target.value)}
              placeholder="Search icons (e.g. coffee, lamp, router)"
              className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--color-border)] rounded-md outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </div>
          <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto border border-[var(--color-border)] rounded-lg p-3">
            {filteredIcons.length === 0 ? (
              <div className="col-span-6 text-center text-sm text-gray-400 py-6">
                No icons match "{iconQuery}"
              </div>
            ) : (
              filteredIcons.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedIcon(name)}
                  title={name}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:bg-gray-50 border-2 ${
                    selectedIcon === name
                      ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]'
                      : 'border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5 text-gray-700" />
                  <span className="text-[9px] text-gray-500 text-center leading-tight truncate w-full">{name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </form>
    </Modal>
  )
}
