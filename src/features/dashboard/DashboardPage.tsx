import { useState } from 'react'
import { motion } from 'framer-motion'
import { Boxes, DollarSign, CheckCircle2, Users2, Wrench, BarChart2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { CategoryCard } from '@/components/dashboard/CategoryCard'
import { StatusDonut, TopCountBar, TopValueBar, ClassificationPie } from '@/components/dashboard/AssetChart'
import { CHART_COLORS } from '@/components/dashboard/colors'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { formatPKR } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Tab = 'company' | 'employee'

function ChartCard({ title, subtitle, children, className }: {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('card p-5 flex flex-col', className)}>
      <div className="mb-4">
        <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
        {subtitle && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gray-200" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 bg-gray-200 rounded w-1/2" />
          <div className="h-7 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded w-2/3" />
    </div>
  )
}

function SkeletonChart({ height = 'h-64' }: { height?: string }) {
  return (
    <div className={cn('card p-5 animate-pulse', height)}>
      <div className="h-3 bg-gray-200 rounded w-1/4 mb-2" />
      <div className="h-2 bg-gray-100 rounded w-1/3 mb-6" />
      <div className="h-full bg-gray-100 rounded" />
    </div>
  )
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]">
        {title}
      </span>
      <div className="flex-1 h-px bg-[var(--color-border)]" />
    </div>
  )
}

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('company')
  const { data, isLoading } = useDashboardStats()

  const tabStats = data?.[activeTab] ?? []
  const combined = data?.combined

  const tabTotal     = tabStats.reduce((s, c) => s + c.total, 0)
  const tabValue     = tabStats.reduce((s, c) => s + c.total_value, 0)
  const tabAvailable = tabStats.reduce((s, c) => s + c.available, 0)
  const tabAllotted  = tabStats.reduce((s, c) => s + c.allotted, 0)
  const tabRepair    = tabStats.reduce((s, c) => s + c.in_repair, 0)

  const pct = (n: number, d: number) =>
    d > 0 ? `${Math.round((n / d) * 100)}% of total` : undefined

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <PageHeader
        title="Dashboard"
        description="Live asset overview across all categories"
      />

      {/* ── Tabs ── */}
      <div className="flex border-b border-[var(--color-border)] mb-6 gap-0">
        {([
          { value: 'company',  label: 'Company Allocated'  },
          { value: 'employee', label: 'Employee Allocated' },
        ] as const).map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={cn(
              'px-5 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px',
              activeTab === value
                ? 'text-[var(--color-primary)] border-[var(--color-primary)]'
                : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text)] hover:border-[var(--color-border)]'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── KPI row ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            label="Total Assets"
            value={tabTotal.toLocaleString()}
            icon={Boxes}
            iconBg={CHART_COLORS.primaryLight}
            iconColor={CHART_COLORS.primary}
            accent
          />
          <StatCard
            label="Total Value"
            value={tabValue > 0 ? formatPKR(tabValue) : '—'}
            icon={DollarSign}
            iconBg="#eaf2fb"
            iconColor={CHART_COLORS.allotted}
          />
          <StatCard
            label="Available"
            value={tabAvailable.toLocaleString()}
            sub={pct(tabAvailable, tabTotal)}
            icon={CheckCircle2}
            iconBg={CHART_COLORS.availableLight}
            iconColor={CHART_COLORS.available}
          />
          <StatCard
            label="Allotted"
            value={tabAllotted.toLocaleString()}
            sub={pct(tabAllotted, tabTotal)}
            icon={Users2}
            iconBg={CHART_COLORS.allottedLight}
            iconColor={CHART_COLORS.allotted}
          />
          <StatCard
            label="In Repair"
            value={tabRepair.toLocaleString()}
            sub={pct(tabRepair, tabTotal)}
            icon={Wrench}
            iconBg={CHART_COLORS.repairLight}
            iconColor={CHART_COLORS.repair}
          />
        </div>
      )}

      {/* ── Charts row: donut (1/3) + stacked count bar (2/3) ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <SkeletonChart />
          <div className="lg:col-span-2"><SkeletonChart /></div>
        </div>
      ) : tabStats.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <ChartCard title="Status Distribution" subtitle="Asset count by status">
            <StatusDonut stats={tabStats} />
          </ChartCard>
          <ChartCard
            title="Top Categories by Count"
            subtitle="Stacked by status — top 10"
            className="lg:col-span-2"
          >
            <TopCountBar stats={tabStats} />
          </ChartCard>
        </div>
      ) : null}

      {/* ── Value bar (full width) ── */}
      {!isLoading && tabStats.some((c) => c.total_value > 0) && (
        <div className="mb-8">
          <ChartCard title="Top Categories by Value" subtitle="Total PKR value — top 10">
            <TopValueBar stats={tabStats} />
          </ChartCard>
        </div>
      )}

      {/* ── Category cards grid ── */}
      {isLoading ? (
        <div className="mb-10">
          <SectionDivider title="By Category" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      ) : tabStats.length > 0 ? (
        <div className="mb-10">
          <SectionDivider title={`${tabStats.length} ${activeTab === 'company' ? 'Company' : 'Employee'} Categories`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {tabStats.map((stat) => (
              <CategoryCard key={stat.type_key} stat={stat} />
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-12 flex flex-col items-center justify-center gap-3 mb-10">
          <BarChart2 className="w-10 h-10 text-[var(--color-text-secondary)] opacity-30" />
          <p className="text-sm text-[var(--color-text-secondary)]">No assets in this classification yet</p>
        </div>
      )}

      {/* ── Total Summary ── */}
      <div className="border-t-2 border-[var(--color-border)] pt-8">
        <SectionDivider title="Organisation-wide Summary" />

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SkeletonChart height="h-80" />
              <SkeletonChart height="h-80" />
            </div>
          </div>
        ) : combined ? (
          <div className="space-y-6">
            {/* Combined KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard
                label="Grand Total"
                value={combined.total.toLocaleString()}
                icon={Boxes}
                iconBg={CHART_COLORS.primaryLight}
                iconColor={CHART_COLORS.primary}
                accent
              />
              <StatCard
                label="Grand Value"
                value={combined.total_value > 0 ? formatPKR(combined.total_value) : '—'}
                icon={DollarSign}
                iconBg="#eaf2fb"
                iconColor={CHART_COLORS.allotted}
              />
              <StatCard
                label="Available"
                value={combined.available.toLocaleString()}
                sub={pct(combined.available, combined.total)}
                icon={CheckCircle2}
                iconBg={CHART_COLORS.availableLight}
                iconColor={CHART_COLORS.available}
              />
              <StatCard
                label="Allotted"
                value={combined.allotted.toLocaleString()}
                sub={pct(combined.allotted, combined.total)}
                icon={Users2}
                iconBg={CHART_COLORS.allottedLight}
                iconColor={CHART_COLORS.allotted}
              />
              <StatCard
                label="In Repair"
                value={combined.in_repair.toLocaleString()}
                sub={pct(combined.in_repair, combined.total)}
                icon={Wrench}
                iconBg={CHART_COLORS.repairLight}
                iconColor={CHART_COLORS.repair}
              />
            </div>

            {/* Classification breakdown charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard title="Classification Breakdown" subtitle="Assets split by allocation type">
                <ClassificationPie
                  employeeTotal={combined.employee_total}
                  companyTotal={combined.company_total}
                  employeeValue={combined.employee_value}
                  companyValue={combined.company_value}
                />
              </ChartCard>

              <ChartCard title="Utilisation Overview" subtitle="Available vs allotted across both classifications">
                <div className="flex flex-col gap-5 mt-2">
                  {[
                    {
                      label: 'Employee Allocated',
                      stats: data!.employee,
                      color: CHART_COLORS.employee,
                      light: CHART_COLORS.allottedLight,
                    },
                    {
                      label: 'Company Allocated',
                      stats: data!.company,
                      color: CHART_COLORS.primary,
                      light: CHART_COLORS.primaryLight,
                    },
                  ].map(({ label, stats, color, light }) => {
                    const total     = stats.reduce((s, c) => s + c.total, 0)
                    const available = stats.reduce((s, c) => s + c.available, 0)
                    const allotted  = stats.reduce((s, c) => s + c.allotted, 0)
                    const repair    = stats.reduce((s, c) => s + c.in_repair, 0)
                    const value     = stats.reduce((s, c) => s + c.total_value, 0)
                    if (total === 0) return null
                    return (
                      <div key={label} className="rounded-xl p-4" style={{ backgroundColor: light }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                            <span className="text-sm font-semibold text-[var(--color-text)]">{label}</span>
                          </div>
                          <span className="text-lg font-bold" style={{ color }}>{total}</span>
                        </div>
                        {/* Segmented bar */}
                        <div className="flex h-2.5 rounded-full overflow-hidden gap-px bg-white/50 mb-2">
                          {available > 0 && (
                            <div className="h-full" style={{ width: `${(available / total) * 100}%`, background: CHART_COLORS.available }} />
                          )}
                          {allotted > 0 && (
                            <div className="h-full" style={{ width: `${(allotted / total) * 100}%`, background: color }} />
                          )}
                          {repair > 0 && (
                            <div className="h-full rounded-r-full" style={{ width: `${(repair / total) * 100}%`, background: CHART_COLORS.repair }} />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                          <div className="flex items-center gap-3">
                            <span><span className="font-medium text-[var(--color-text)]">{available}</span> free</span>
                            <span><span className="font-medium text-[var(--color-text)]">{allotted}</span> in use</span>
                            {repair > 0 && <span><span className="font-medium text-[var(--color-text)]">{repair}</span> repair</span>}
                          </div>
                          {value > 0 && (
                            <span className="font-medium text-[var(--color-text)]">{formatPKR(value)}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ChartCard>
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
