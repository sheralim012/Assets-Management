import { formatPKR } from '@/lib/utils'
import { CHART_COLORS } from './colors'
import type { CategoryStats } from '@/hooks/useDashboardStats'

interface CategoryCardProps {
  stat: CategoryStats
}

export function CategoryCard({ stat }: CategoryCardProps) {
  const { total, available, allotted, in_repair, total_value } = stat
  const availablePct = total > 0 ? (available / total) * 100 : 0
  const allottedPct = total > 0 ? (allotted / total) * 100 : 0
  const repairPct = total > 0 ? (in_repair / total) * 100 : 0
  const avgValue = total > 0 && total_value > 0 ? Math.round(total_value / total) : 0

  return (
    <div className="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
      {/* Header: name + total count */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[var(--color-text)] capitalize leading-tight">
            {stat.label}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 font-mono">
            {stat.tag_prefix || stat.type_key}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-2xl font-bold text-[var(--color-primary)] leading-none">{total}</span>
          <p className="text-[10px] text-[var(--color-text-secondary)] leading-tight">total</p>
        </div>
      </div>

      {/* Status pills */}
      <div className="grid grid-cols-3 gap-1.5">
        <div
          className="rounded-lg px-2 py-2 text-center"
          style={{ backgroundColor: CHART_COLORS.availableLight }}
        >
          <p className="text-sm font-bold leading-none" style={{ color: CHART_COLORS.available }}>
            {available}
          </p>
          <p className="text-[10px] mt-0.5 font-medium" style={{ color: CHART_COLORS.available }}>
            Available
          </p>
        </div>
        <div
          className="rounded-lg px-2 py-2 text-center"
          style={{ backgroundColor: CHART_COLORS.allottedLight }}
        >
          <p className="text-sm font-bold leading-none" style={{ color: CHART_COLORS.allotted }}>
            {allotted}
          </p>
          <p className="text-[10px] mt-0.5 font-medium" style={{ color: CHART_COLORS.allotted }}>
            Allotted
          </p>
        </div>
        <div
          className="rounded-lg px-2 py-2 text-center"
          style={{ backgroundColor: CHART_COLORS.repairLight }}
        >
          <p className="text-sm font-bold leading-none" style={{ color: CHART_COLORS.repair }}>
            {in_repair}
          </p>
          <p className="text-[10px] mt-0.5 font-medium" style={{ color: CHART_COLORS.repair }}>
            In Repair
          </p>
        </div>
      </div>

      {/* Segmented utilisation bar */}
      {total > 0 && (
        <div>
          <div className="flex h-2 rounded-full overflow-hidden gap-px bg-[var(--color-border-light)]">
            {availablePct > 0 && (
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${availablePct}%`, backgroundColor: CHART_COLORS.available }}
              />
            )}
            {allottedPct > 0 && (
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${allottedPct}%`, backgroundColor: CHART_COLORS.allotted }}
              />
            )}
            {repairPct > 0 && (
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${repairPct}%`, backgroundColor: CHART_COLORS.repair }}
              />
            )}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-[var(--color-text-secondary)]">
              {Math.round(availablePct)}% free
            </span>
            <span className="text-[10px] text-[var(--color-text-secondary)]">
              {Math.round(allottedPct)}% in use
            </span>
          </div>
        </div>
      )}

      {/* Value row */}
      {total_value > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-light)]">
          <span className="text-xs text-[var(--color-text-secondary)]">Total value</span>
          <div className="text-right">
            <span className="text-xs font-semibold text-[var(--color-text)]">
              {formatPKR(total_value)}
            </span>
            {avgValue > 0 && (
              <p className="text-[10px] text-[var(--color-text-secondary)]">
                avg {formatPKR(avgValue)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
