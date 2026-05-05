import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { formatPKR } from '@/lib/utils'
import { CHART_COLORS } from './colors'
import type { CategoryStats } from '@/hooks/useDashboardStats'

// ── Custom Tooltip ──────────────────────────────────────────────────────────

function TooltipBox({ label, rows }: { label?: string; rows: { name: string; value: string | number; color?: string }[] }) {
  return (
    <div className="bg-white border border-[#dee2e6] rounded-xl shadow-lg px-4 py-3 min-w-[160px]">
      {label && <p className="text-xs font-semibold text-[#5d6d7e] mb-2 border-b border-[#dee2e6] pb-1.5">{label}</p>}
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              {r.color && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />}
              <span className="text-xs text-[#5d6d7e]">{r.name}</span>
            </div>
            <span className="text-xs font-semibold text-[#202427]">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Status Donut ────────────────────────────────────────────────────────────

interface StatusDonutProps {
  stats: CategoryStats[]
}

export function StatusDonut({ stats }: StatusDonutProps) {
  const available = stats.reduce((s, c) => s + c.available, 0)
  const allotted = stats.reduce((s, c) => s + c.allotted, 0)
  const in_repair = stats.reduce((s, c) => s + c.in_repair, 0)
  const total = available + allotted + in_repair

  const segments = [
    { name: 'Available', value: available, color: CHART_COLORS.available },
    { name: 'Allotted',  value: allotted,  color: CHART_COLORS.allotted  },
    { name: 'In Repair', value: in_repair, color: CHART_COLORS.repair    },
  ].filter((d) => d.value > 0)

  if (total === 0) return <EmptyChart />

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Donut with centre label */}
      <div className="relative flex-shrink-0" style={{ width: 200, height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              startAngle={90}
              endAngle={-270}
            >
              {segments.map((s) => <Cell key={s.name} fill={s.color} />)}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <TooltipBox rows={[
                    { name: d.name, value: `${d.value} (${Math.round((d.value / total) * 100)}%)`, color: d.color },
                  ]} />
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-[#195274] leading-none">{total}</span>
          <span className="text-xs text-[#5d6d7e] mt-0.5">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full space-y-2">
        {segments.map((d) => {
          const pct = Math.round((d.value / total) * 100)
          return (
            <div key={d.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs text-[#5d6d7e]">{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#202427]">{d.value}</span>
                  <span className="text-xs text-[#5d6d7e] w-8 text-right">{pct}%</span>
                </div>
              </div>
              <div className="h-1 rounded-full bg-[#dee2e6] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: d.color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Top Count Bar ───────────────────────────────────────────────────────────

interface TopCountBarProps {
  stats: CategoryStats[]
}

export function TopCountBar({ stats }: TopCountBarProps) {
  const top = [...stats]
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map((c) => ({
      name: c.label.length > 16 ? c.label.slice(0, 15) + '…' : c.label,
      Available: c.available,
      Allotted: c.allotted,
      'In Repair': c.in_repair,
    }))

  if (top.length === 0) return <EmptyChart />

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={top} layout="vertical" margin={{ left: 4, right: 24, top: 4, bottom: 4 }} barSize={14}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#dee2e6" />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: '#5d6d7e' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: '#5d6d7e' }}
          width={100}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#eaf2f8', radius: 4 }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const total = payload.reduce((s, p) => s + ((p.value as number) || 0), 0)
            return (
              <TooltipBox
                label={String(label ?? '')}
                rows={[
                  ...payload.map((p) => ({ name: String(p.name ?? ''), value: p.value as number, color: p.fill })),
                  { name: 'Total', value: total },
                ]}
              />
            )
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(v) => <span style={{ color: '#5d6d7e' }}>{v}</span>}
        />
        <Bar dataKey="Available" stackId="a" fill={CHART_COLORS.available} radius={0} />
        <Bar dataKey="Allotted"  stackId="a" fill={CHART_COLORS.allotted}  radius={0} />
        <Bar dataKey="In Repair" stackId="a" fill={CHART_COLORS.repair}    radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Top Value Bar ───────────────────────────────────────────────────────────

interface TopValueBarProps {
  stats: CategoryStats[]
}

export function TopValueBar({ stats }: TopValueBarProps) {
  const top = [...stats]
    .filter((c) => c.total_value > 0)
    .sort((a, b) => b.total_value - a.total_value)
    .slice(0, 10)
    .map((c) => ({
      name: c.label.length > 16 ? c.label.slice(0, 15) + '…' : c.label,
      value: c.total_value,
      available: c.available_value,
      allotted: c.allotted_value,
    }))

  if (top.length === 0) return <EmptyChart />

  const max = top[0]?.value ?? 1

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={top} layout="vertical" margin={{ left: 4, right: 24, top: 4, bottom: 4 }} barSize={14}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#dee2e6" />
        <XAxis
          type="number"
          domain={[0, max]}
          tick={{ fontSize: 10, fill: '#5d6d7e' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: '#5d6d7e' }}
          width={100}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#eaf2f8', radius: 4 }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            return (
              <TooltipBox
                label={String(label ?? '')}
                rows={[
                  { name: 'Total Value',     value: formatPKR(d.value)     },
                  { name: 'Available Value', value: formatPKR(d.available), color: CHART_COLORS.available },
                  { name: 'Allotted Value',  value: formatPKR(d.allotted),  color: CHART_COLORS.allotted  },
                ]}
              />
            )
          }}
        />
        <Bar dataKey="value" name="Total Value" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Classification Pie ──────────────────────────────────────────────────────

interface ClassificationPieProps {
  employeeTotal: number
  companyTotal: number
  employeeValue: number
  companyValue: number
}

export function ClassificationPie({ employeeTotal, companyTotal, employeeValue, companyValue }: ClassificationPieProps) {
  const total = employeeTotal + companyTotal
  const segments = [
    { name: 'Employee', value: employeeTotal, color: CHART_COLORS.employee, valueLabel: formatPKR(employeeValue) },
    { name: 'Company',  value: companyTotal,  color: CHART_COLORS.primary,  valueLabel: formatPKR(companyValue)  },
  ].filter((d) => d.value > 0)

  if (total === 0) return <EmptyChart />

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative flex-shrink-0" style={{ width: 200, height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              startAngle={90}
              endAngle={-270}
            >
              {segments.map((s) => <Cell key={s.name} fill={s.color} />)}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <TooltipBox rows={[
                    { name: d.name,  value: `${d.value} assets`, color: d.color },
                    { name: 'Value', value: d.valueLabel },
                  ]} />
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-[#195274] leading-none">{total}</span>
          <span className="text-xs text-[#5d6d7e] mt-0.5">Total</span>
        </div>
      </div>

      <div className="w-full space-y-3">
        {segments.map((d) => {
          const pct = Math.round((d.value / total) * 100)
          return (
            <div key={d.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs text-[#5d6d7e]">{d.name} Allocated</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-[#202427]">{d.value} assets</span>
                  <span className="text-xs text-[#5d6d7e] ml-2">{pct}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-[#dee2e6] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: d.color }} />
              </div>
              <p className="text-[10px] text-[#5d6d7e] mt-0.5 text-right">{d.valueLabel}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Empty state ─────────────────────────────────────────────────────────────

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-40 text-sm text-[#5d6d7e]">
      No data available
    </div>
  )
}
