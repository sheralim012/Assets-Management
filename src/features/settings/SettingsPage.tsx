import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Pencil, LayoutGrid, Plus, Trash2, GripVertical } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EditCategoryModal } from './EditCategoryModal'
import { AddCategoryModal } from './AddCategoryModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  useCategories,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
  type CategoryConfig,
} from '@/hooks/useCategories'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

function getIcon(iconName: string | undefined): React.ComponentType<{ className?: string; size?: number }> {
  if (!iconName) return LucideIcons.Package as React.ComponentType<{ className?: string; size?: number }>
  const Icon = (LucideIcons as Record<string, unknown>)[iconName] as React.ComponentType<{ className?: string; size?: number }> | undefined
  return Icon ?? (LucideIcons.Package as React.ComponentType<{ className?: string; size?: number }>)
}

interface CategoryCardProps {
  category: CategoryConfig
  onEdit: (c: CategoryConfig) => void
  onToggle: (c: CategoryConfig) => void
  onDelete: (c: CategoryConfig) => void
  onUpdatePrefix: (c: CategoryConfig, newPrefix: string) => Promise<void>
  toggling: boolean
  isDragging: boolean
  isDragOver: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onDragEnd: () => void
}

function CategoryCard({
  category,
  onEdit,
  onToggle,
  onDelete,
  onUpdatePrefix,
  toggling,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: CategoryCardProps) {
  const [prefixVal, setPrefixVal] = useState(category.tag_prefix)
  const [saving, setSaving] = useState(false)
  const [draggable, setDraggable] = useState(false)
  const Icon = getIcon(category.icon)

  useEffect(() => { setPrefixVal(category.tag_prefix) }, [category.tag_prefix])

  async function savePrefix() {
    const cleaned = prefixVal.trim().toUpperCase()
    if (!cleaned || cleaned === category.tag_prefix) {
      setPrefixVal(category.tag_prefix)
      return
    }
    setSaving(true)
    try {
      await onUpdatePrefix(category, cleaned)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={() => { setDraggable(false); onDragEnd() }}
      className={`card p-4 flex flex-col gap-3 relative transition-all ${!category.is_active ? 'opacity-50' : ''} ${isDragOver ? 'ring-2 ring-[var(--color-primary)] ring-offset-2' : ''} ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onMouseDown={() => setDraggable(true)}
            onMouseUp={() => setDraggable(false)}
            className="p-1 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            title="Drag to reorder"
            aria-label="Drag handle"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
          <div className={`w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 ${category.is_active ? 'bg-[var(--color-primary)]/10' : 'bg-gray-100'}`}>
            <Icon
              size={20}
              className={category.is_active ? 'text-[var(--color-primary)]' : 'text-gray-400'}
            />
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(category)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors text-slate-400 hover:text-[var(--color-primary)]"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-1.5 rounded hover:bg-red-50 transition-colors text-slate-400 hover:text-red-500"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={toggling}
            onClick={() => onToggle(category)}
            className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${category.is_active ? 'bg-[var(--color-primary)]' : 'bg-gray-300'} disabled:opacity-60`}
            title={category.is_active ? 'Deactivate' : 'Activate'}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${category.is_active ? 'translate-x-4' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-[var(--color-text)] leading-tight">{category.label}</p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 font-mono">{category.type_key}</p>
      </div>

      <div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Tag Prefix</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[var(--color-border)] rounded overflow-hidden">
            <input
              value={prefixVal}
              onChange={(e) => setPrefixVal(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
              onBlur={savePrefix}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur() } }}
              disabled={saving}
              className="w-16 px-2 py-1 text-xs font-mono font-semibold text-[var(--color-primary)] bg-[var(--color-primary)]/5 text-center outline-none disabled:opacity-60"
            />
          </div>
          <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap">
            → {prefixVal || 'OTH'}-0001
          </span>
        </div>
      </div>

      {!category.is_active && (
        <span className="inline-flex items-center self-start px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
          Inactive
        </span>
      )}
    </div>
  )
}

interface SortableCategoryGroupProps {
  categories: CategoryConfig[]
  onEdit: (c: CategoryConfig) => void
  onToggle: (c: CategoryConfig) => void
  onDelete: (c: CategoryConfig) => void
  onUpdatePrefix: (c: CategoryConfig, newPrefix: string) => Promise<void>
  togglingKey: string | null
  onReorder: (newOrder: CategoryConfig[]) => void
}

function SortableCategoryGroup({
  categories,
  onEdit,
  onToggle,
  onDelete,
  onUpdatePrefix,
  togglingKey,
  onReorder,
}: SortableCategoryGroupProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const draggingIdRef = useRef<string | null>(null)

  function handleDragStart(e: React.DragEvent, id: string) {
    draggingIdRef.current = id
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
    try { e.dataTransfer.setData('text/plain', id) } catch { /* ignore */ }
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverId !== id) setDragOverId(id)
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    const sourceId = draggingIdRef.current
    setDragOverId(null)
    setDraggingId(null)
    draggingIdRef.current = null
    if (!sourceId || sourceId === targetId) return

    const sourceIdx = categories.findIndex((c) => c.id === sourceId)
    const targetIdx = categories.findIndex((c) => c.id === targetId)
    if (sourceIdx === -1 || targetIdx === -1) return

    const next = [...categories]
    const [moved] = next.splice(sourceIdx, 1)
    next.splice(targetIdx, 0, moved)
    onReorder(next)
  }

  function handleDragEnd() {
    setDragOverId(null)
    setDraggingId(null)
    draggingIdRef.current = null
  }

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
      {categories.map((cat) => (
        <CategoryCard
          key={cat.type_key}
          category={cat}
          onEdit={onEdit}
          onToggle={onToggle}
          onDelete={onDelete}
          onUpdatePrefix={onUpdatePrefix}
          toggling={togglingKey === cat.type_key}
          isDragging={draggingId === cat.id}
          isDragOver={dragOverId === cat.id && draggingId !== cat.id}
          onDragStart={(e) => handleDragStart(e, cat.id)}
          onDragOver={(e) => handleDragOver(e, cat.id)}
          onDragLeave={() => setDragOverId((prev) => (prev === cat.id ? null : prev))}
          onDrop={(e) => handleDrop(e, cat.id)}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  )
}

export function SettingsPage() {
  const [editCategory, setEditCategory] = useState<CategoryConfig | null>(null)
  const [addClassification, setAddClassification] = useState<'employee_allocated' | 'company_allocated' | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<CategoryConfig | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)

  const { data: categories, isLoading } = useCategories()
  const updateCategory = useUpdateCategory()
  const deleteCategoryMutation = useDeleteCategory()
  const reorderCategories = useReorderCategories()

  const employeeCategories = (categories ?? [])
    .filter((c) => c.classification === 'employee_allocated')
    .sort((a, b) => a.sort_order - b.sort_order)

  const companyCategories = (categories ?? [])
    .filter((c) => c.classification === 'company_allocated')
    .sort((a, b) => a.sort_order - b.sort_order)

  async function handleToggle(category: CategoryConfig) {
    setTogglingKey(category.type_key)
    try {
      await updateCategory.mutateAsync({ ...category, is_active: !category.is_active })
      toast.success(`${category.label} ${!category.is_active ? 'activated' : 'deactivated'}`)
    } catch {
      toast.error('Failed to update category')
    } finally {
      setTogglingKey(null)
    }
  }

  async function handleUpdatePrefix(category: CategoryConfig, newPrefix: string) {
    try {
      await updateCategory.mutateAsync({ ...category, tag_prefix: newPrefix })
      toast.success(`Tag prefix updated to ${newPrefix}`)
    } catch {
      toast.error('Failed to update tag prefix')
    }
  }

  async function handleReorder(newOrder: CategoryConfig[]) {
    const items = newOrder.map((cat, idx) => ({ id: cat.id, sort_order: idx + 1 }))
    try {
      await reorderCategories.mutateAsync(items)
    } catch {
      toast.error('Failed to reorder categories')
    }
  }

  async function handleDelete() {
    if (!deleteCategory) return
    setDeleting(true)
    try {
      const { count } = await supabase
        .from('assets')
        .select('id', { count: 'exact', head: true })
        .eq('asset_type', deleteCategory.type_key)

      if (count && count > 0) {
        toast.error(`Cannot delete — ${count} asset${count === 1 ? '' : 's'} exist with this type`)
        setDeleteCategory(null)
        return
      }

      await deleteCategoryMutation.mutateAsync(deleteCategory.id)
      toast.success(`${deleteCategory.label} deleted`)
      setDeleteCategory(null)
    } catch {
      toast.error('Failed to delete category')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <PageHeader
        title="Settings"
        description="Configure asset categories and system preferences"
      />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid className="w-4 h-4 text-[var(--color-primary)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Asset Categories</h2>
          <span className="text-xs text-[var(--color-text-secondary)] ml-1">
            Drag <GripVertical className="inline w-3 h-3 align-middle text-gray-400" /> to reorder · this order is shown on the Assets page
          </span>
        </div>

        {isLoading ? (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="card p-4 h-36 animate-pulse bg-gray-50" />
            ))}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-2 h-2 rounded-full bg-[var(--color-allotted)]" />
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                  Employee Assets
                </p>
                <span className="text-xs text-[var(--color-text-secondary)]">({employeeCategories.length})</span>
                <button
                  onClick={() => setAddClassification('employee_allocated')}
                  className="ml-auto flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Category
                </button>
              </div>
              <SortableCategoryGroup
                categories={employeeCategories}
                onEdit={setEditCategory}
                onToggle={handleToggle}
                onDelete={setDeleteCategory}
                onUpdatePrefix={handleUpdatePrefix}
                togglingKey={togglingKey}
                onReorder={handleReorder}
              />
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                  Company Assets
                </p>
                <span className="text-xs text-[var(--color-text-secondary)]">({companyCategories.length})</span>
                <button
                  onClick={() => setAddClassification('company_allocated')}
                  className="ml-auto flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Category
                </button>
              </div>
              <SortableCategoryGroup
                categories={companyCategories}
                onEdit={setEditCategory}
                onToggle={handleToggle}
                onDelete={setDeleteCategory}
                onUpdatePrefix={handleUpdatePrefix}
                togglingKey={togglingKey}
                onReorder={handleReorder}
              />
            </div>
          </>
        )}
      </div>

      {editCategory && (
        <EditCategoryModal
          open={!!editCategory}
          onClose={() => setEditCategory(null)}
          category={editCategory}
        />
      )}

      {addClassification && (
        <AddCategoryModal
          open={!!addClassification}
          onClose={() => setAddClassification(null)}
          classification={addClassification}
          nextSortOrder={
            (addClassification === 'employee_allocated' ? employeeCategories : companyCategories).length + 1
          }
        />
      )}

      <ConfirmDialog
        open={!!deleteCategory}
        onClose={() => setDeleteCategory(null)}
        onConfirm={handleDelete}
        title={`Delete '${deleteCategory?.label}'?`}
        description="This will remove it from the category grid. Existing assets of this type will not be deleted."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </motion.div>
  )
}
