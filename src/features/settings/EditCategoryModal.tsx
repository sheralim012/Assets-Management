import { useEffect, useState, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Search } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useUpdateCategory, type CategoryConfig } from '@/hooks/useCategories'
import { CATEGORY_ICON_OPTIONS, getCategoryIcon } from './categoryIcons'

const schema = z.object({
  label: z.string().min(1, 'Label is required'),
  tag_prefix: z.string().max(8, 'Max 8 characters'),
  is_active: z.boolean(),
})
type FormValues = z.infer<typeof schema>

interface EditCategoryModalProps {
  open: boolean
  onClose: () => void
  category: CategoryConfig
}

export function EditCategoryModal({ open, onClose, category }: EditCategoryModalProps) {
  const updateCategory = useUpdateCategory()
  const [selectedIcon, setSelectedIcon] = useState(category.icon ?? 'Package')
  const [iconQuery, setIconQuery] = useState('')

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: category.label,
      tag_prefix: category.tag_prefix ?? '',
      is_active: category.is_active,
    },
  })

  const tagPrefixVal = watch('tag_prefix')

  useEffect(() => {
    if (open) {
      reset({
        label: category.label,
        tag_prefix: category.tag_prefix ?? '',
        is_active: category.is_active,
      })
      setSelectedIcon(category.icon ?? 'Package')
      setIconQuery('')
    }
  }, [open, category, reset])

  const filteredIcons = useMemo(() => {
    const q = iconQuery.trim().toLowerCase()
    if (!q) return CATEGORY_ICON_OPTIONS
    return CATEGORY_ICON_OPTIONS.filter((opt) =>
      opt.name.toLowerCase().includes(q) ||
      (opt.keywords ?? '').toLowerCase().includes(q)
    )
  }, [iconQuery])

  async function onSubmit(values: FormValues) {
    try {
      await updateCategory.mutateAsync({
        ...category,
        label: values.label,
        tag_prefix: values.tag_prefix.trim() ? values.tag_prefix.trim().toUpperCase() : null,
        is_active: values.is_active,
        icon: selectedIcon,
      })
      toast.success('Category updated')
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update category')
    }
  }

  const SelectedIcon = getCategoryIcon(selectedIcon)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Category"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={updateCategory.isPending}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-3 mb-5 p-3 bg-[var(--color-bg)] rounded-lg">
        <div className="w-10 h-10 flex items-center justify-center bg-[var(--color-primary)]/10 rounded-lg">
          <SelectedIcon size={22} className="text-[var(--color-primary)]" />
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-secondary)]">slug</p>
          <p className="font-mono text-sm font-semibold text-[var(--color-text)]">{category.type_key}</p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Display Name *"
          {...register('label')}
          error={errors.label?.message}
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
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              Preview: <span className="font-mono font-semibold">{tagPrefixVal.toUpperCase()}-0001</span>
              {' '}· This prefix will auto-fill when creating assets
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              Leave blank if assets have mixed or non-standard tags
            </p>
          )}
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
          <div className="grid grid-cols-6 gap-2 max-h-56 overflow-y-auto border border-[var(--color-border)] rounded-lg p-3">
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

        <Controller
          name="is_active"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between p-3 bg-[var(--color-bg)] rounded-lg">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">Active</p>
                <p className="text-xs text-[var(--color-text-secondary)]">Inactive types are hidden from all dropdowns</p>
              </div>
              <button
                type="button"
                onClick={() => field.onChange(!field.value)}
                className={`relative w-11 h-6 rounded-full transition-colors ${field.value ? 'bg-[var(--color-primary)]' : 'bg-gray-300'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${field.value ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
          )}
        />
      </form>
    </Modal>
  )
}
