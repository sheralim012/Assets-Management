import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { CategoryCard } from '@/components/dashboard/CategoryCard'
import { StatusDonut, TopCountBar, TopValueBar, ClassificationPie } from '@/components/dashboard/AssetChart'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { formatPKR } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Tab = 'company' | 'employee'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-4">
      {children}
    </h3>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-[var(--color-text)] mb-4">{title}</p>
      {children}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  )
}

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('company')
  const { data, isLoading } = useDashboardStats()

  const tabStats = data?.[activeTab] ?? []
  const combined = data?.combined

  const tabTotal = tabStats.reduce((s, c) => s + c.total, 0)
  const tabValue = tabStats.reduce((s, c) => s + c.total_value, 0)
  const tabAvailable = tabStats.reduce((s, c) => s + c.available, 0)
  const tabAllotted = tabStats.reduce((s, c) => s + c.allotted, 0)

  const pct = (n: number, total: number) =>
    total > 0 ? `${Math.round((n / total) * 100)}% of total` : undefined

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <PageHeader
        title="Dashboard"
        description="Live overview of all assets across the organization"
      />

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] mb-6 gap-1">
        {([
          { value: 'company', label: 'Company Allocated' },
          { value: 'employee', label: 'Employee Allocated' },
        ] as const).map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
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

      {/* Summary stat cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Assets" value={tabTotal.toLocaleString()} accent />
          <StatCard
            label="Total Value"
            value={tabValue > 0 ? formatPKR(tabValue) : '—'}
          />
          <StatCard
            label="Available"
            value={tabAvailable.toLocaleString()}
            sub={pct(tabAvailable, tabTotal)}
          />
          <StatCard
            label="Allotted"
            value={tabAllotted.toLocaleString()}
            sub={pct(tabAllotted, tabTotal)}
          />
        </div>
      )}

      {/* Charts row */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-52">
              <div className="h-3 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-32 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : tabStats.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <ChartCard title="Status Distribution">
            <StatusDonut stats={tabStats} />
          </ChartCard>
          <ChartCard title="Top Categories by Count">
            <TopCountBar stats={tabStats} />
          </ChartCard>
          <ChartCard title="Top Categories by Value">
            <TopValueBar stats={tabStats} />
          </ChartCard>
        </div>
      ) : null}

      {/* Category cards grid */}
      {isLoading ? (
        <>
          <SectionTitle>By Category</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </>
      ) : tabStats.length > 0 ? (
        <>
          <SectionTitle>By Category</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
            {tabStats.map((stat) => (
              <CategoryCard key={stat.type_key} stat={stat} />
            ))}
          </div>
        </>
      ) : (
        <div className="card p-10 flex flex-col items-center justify-center gap-3 mb-10">
          <BarChart2 className="w-10 h-10 text-[var(--color-text-secondary)] opacity-40" />
          <p className="text-sm text-[var(--color-text-secondary)]">No assets in this classification yet</p>
        </div>
      )}

      {/* Total Summary section */}
      <div className="border-t border-[var(--color-border)] pt-8">
        <SectionTitle>Total Summary — All Classifications</SectionTitle>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : combined ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <StatCard label="Grand Total" value={combined.total.toLocaleString()} accent />
              <StatCard label="Total Value" value={combined.total_value > 0 ? formatPKR(combined.total_value) : '—'} />
              <StatCard label="Available" value={combined.available.toLocaleString()} sub={pct(combined.available, combined.total)} />
              <StatCard label="Allotted" value={combined.allotted.toLocaleString()} sub={pct(combined.allotted, combined.total)} />
              <StatCard label="In Repair" value={combined.in_repair.toLocaleString()} sub={pct(combined.in_repair, combined.total)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard title="Classification Breakdown">
                <ClassificationPie
                  employeeTotal={combined.employee_total}
                  companyTotal={combined.company_total}
                />
              </ChartCard>
              <div className="card p-5">
                <p className="text-sm font-semibold text-[var(--color-text)] mb-4">Value by Classification</p>
                <div className="space-y-4">
                  {[
                    { label: 'Employee Allocated', total: combined.employee_total, value: combined.employee_value, color: '#2563eb' },
                    { label: 'Company Allocated', total: combined.company_total, value: combined.company_value, color: 'var(--color-primary)' },
                  ].map((row) => {
                    const pctOfTotal = combined.total > 0 ? Math.round((row.total / combined.total) * 100) : 0
                    return (
                      <div key={row.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: row.color }} />
                            <span className="text-sm text-[var(--color-text)]">{row.label}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-[var(--color-text)]">
                              {row.total.toLocaleString()} assets
                            </span>
                            <span className="text-xs text-[var(--color-text-secondary)] ml-2">
                              {row.value > 0 ? formatPKR(row.value) : '—'}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pctOfTotal}%`, background: row.color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </motion.div>
  )
}
