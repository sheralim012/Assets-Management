import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { AssetCategoryGrid } from './AssetCategoryGrid'
import { AssetTable } from './AssetTable'
import { AddAssetModal } from './AddAssetModal'
import { useAssets } from '@/hooks/useAssets'
import { useCategories } from '@/hooks/useCategories'
import type { AssetType } from '@/types'
import { cn } from '@/lib/utils'

type TabType = 'employee_allocated' | 'company_allocated'

export function AssetsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('employee_allocated')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [manufacturerFilter, setManufacturerFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: assets } = useAssets({ classification: activeTab })
  const { data: allCategories } = useCategories()

  const activeCategories = (allCategories ?? [])
    .filter((c) => c.classification === activeTab && c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)

  function handleTabChange(tab: TabType) {
    setActiveTab(tab)
    setSelectedType(null)
    setStatusFilter('all')
    setManufacturerFilter('all')
  }

  function handleSelectType(type: string) {
    setSelectedType(type)
    setStatusFilter('all')
    setManufacturerFilter('all')
    setSearchQuery('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <PageHeader
        title="Assets"
        description="Manage and track all company assets"
        actions={
          <Button variant="primary" onClick={() => setAddModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Asset
          </Button>
        }
      />

      {/* Global search */}
      <div className="mb-5">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by tag, description, location..."
          className="w-full max-w-md"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] mb-6 gap-1">
        {(
          [
            { value: 'employee_allocated', label: 'Employee Allocated' },
            { value: 'company_allocated', label: 'Company Allocated' },
          ] as const
        ).map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleTabChange(value)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px',
              activeTab === value
                ? 'text-[var(--color-primary)] border-[var(--color-primary)]'
                : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text)]'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid or Table */}
      <AnimatePresence mode="wait">
        {!selectedType && !searchQuery ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <AssetCategoryGrid
              assets={assets ?? []}
              categories={activeCategories}
              onSelectType={handleSelectType}
            />
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <AssetTable
              classification={activeTab}
              assetType={selectedType}
              onBack={() => { setSelectedType(null); setSearchQuery(''); setManufacturerFilter('all') }}
              onAddAsset={() => setAddModalOpen(true)}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              manufacturerFilter={manufacturerFilter}
              onManufacturerFilterChange={setManufacturerFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AddAssetModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        defaultClassification={activeTab}
        defaultType={selectedType as AssetType | undefined}
      />
    </motion.div>
  )
}
