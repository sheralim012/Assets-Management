import { Package } from 'lucide-react'
import { formatPKR } from '@/lib/utils'
import type { CategoryStats } from '@/hooks/useDashboardStats'

interface CategoryCardProps {
  stat: CategoryStats
}

export function CategoryCard({ stat }: CategoryCardProps) {
  const { total, available, allotted, in_repair, total_value } = stat
  const availablePct = total > 0 ? Math.round((available / total) * 100) : 0
  const allottedPct = total > 0 ? Math.round((allotted / total) * 100) : 0

  return (
    <div className="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center flex-shrink-0">
          <Package className="w-4.5 h-4.5 text-[var(--color-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[var(--color-text)] truncate capitalize">
            {stat.label}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {stat.tag_prefix || stat.type_key}
          </p>
        </div>
        <span className="text-2xl font-bold text-[var(--color-primary)]">{total}</span>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-[var(--color-available-light,#f0fdf4)] px-2 py-1.5">
          <p className="text-xs font-semibold text-[#16a34a]">{available}</p>
          <p className="text-[10px] text-[#16a34a]/70 leading-tight">Available</p>
        </div>
        <div className="rounded-md bg-[#eff6ff] px-2 py-1.5">
          <p className="text-xs font-semibold text-[#2563eb]">{allotted}</p>
          <p className="text-[10px] text-[#2563eb]/70 leading-tight">Allotted</p>
        </div>
        <div className="rounded-md bg-[#fff7ed] px-2 py-1.5">
          <p className="text-xs font-semibold text-[#ea580c]">{in_repair}</p>
          <p className="text-[10px] text-[#ea580c]/70 leading-tight">In Repair</p>
        </div>
      </div>

      {/* Value */}
      {total_value > 0 && (
        <p className="text-xs text-[var(--color-text-secondary)]">
          Value: <span className="font-semibold text-[var(--color-text)]">{formatPKR(total_value)}</span>
        </p>
      )}

      {/* Availability bar */}
      {total > 0 && (
        <div>
          <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100">
            <div
              className="bg-[#16a34a] transition-all"
              style={{ width: `${availablePct}%` }}
            />
            <div
              className="bg-[#2563eb] transition-all"
              style={{ width: `${allottedPct}%` }}
            />
            <div
              className="bg-[#ea580c] transition-all"
              style={{ width: `${100 - availablePct - allottedPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-[var(--color-text-secondary)]">
            <span>{availablePct}% free</span>
            <span>{allottedPct}% in use</span>
          </div>
        </div>
      )}
    </div>
  )
}
