import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { formatPKR } from '@/lib/utils'
import type { CategoryStats } from '@/hooks/useDashboardStats'

const STATUS_COLORS = {
  available: '#16a34a',
  allotted: '#2563eb',
  in_repair: '#ea580c',
}

interface StatusDonutProps {
  stats: CategoryStats[]
}

export function StatusDonut({ stats }: StatusDonutProps) {
  const available = stats.reduce((s, c) => s + c.available, 0)
  const allotted = stats.reduce((s, c) => s + c.allotted, 0)
  const in_repair = stats.reduce((s, c) => s + c.in_repair, 0)
  const total = available + allotted + in_repair

  const data = [
    { name: 'Available', value: available, color: STATUS_COLORS.available },
    { name: 'Allotted', value: allotted, color: STATUS_COLORS.allotted },
    { name: 'In Repair', value: in_repair, color: STATUS_COLORS.in_repair },
  ].filter((d) => d.value > 0)

  if (total === 0) return <EmptyChart />

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value} assets`, '']}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex flex-col gap-2 flex-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="text-sm text-[var(--color-text-secondary)]">{d.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--color-text)]">{d.value}</span>
              <span className="text-xs text-[var(--color-text-secondary)] w-10 text-right">
                {Math.round((d.value / total) * 100)}%
              </span>
            </div>
          </div>
        ))}
        <div className="border-t border-[var(--color-border)] pt-1.5 mt-0.5 flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-secondary)]">Total</span>
          <span className="text-sm font-bold text-[var(--color-text)]">{total}</span>
        </div>
      </div>
    </div>
  )
}

interface TopCountBarProps {
  stats: CategoryStats[]
}

export function TopCountBar({ stats }: TopCountBarProps) {
  const top = [...stats]
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map((c) => ({
      name: c.label.length > 14 ? c.label.slice(0, 13) + '…' : c.label,
      available: c.available,
      allotted: c.allotted,
      in_repair: c.in_repair,
    }))

  if (top.length === 0) return <EmptyChart />

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={top} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
        <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="available" name="Available" stackId="a" fill={STATUS_COLORS.available} radius={0} />
        <Bar dataKey="allotted" name="Allotted" stackId="a" fill={STATUS_COLORS.allotted} radius={0} />
        <Bar dataKey="in_repair" name="In Repair" stackId="a" fill={STATUS_COLORS.in_repair} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface TopValueBarProps {
  stats: CategoryStats[]
}

export function TopValueBar({ stats }: TopValueBarProps) {
  const top = [...stats]
    .filter((c) => c.total_value > 0)
    .sort((a, b) => b.total_value - a.total_value)
    .slice(0, 10)
    .map((c) => ({
      name: c.label.length > 14 ? c.label.slice(0, 13) + '…' : c.label,
      value: c.total_value,
    }))

  if (top.length === 0) return <EmptyChart />

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={top} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
        <XAxis
          type="number"
          tick={{ fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
        />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(v) => [formatPKR(Number(v)), 'Total Value']}
        />
        <Bar dataKey="value" name="Value" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface ClassificationPieProps {
  employeeTotal: number
  companyTotal: number
}

export function ClassificationPie({ employeeTotal, companyTotal }: ClassificationPieProps) {
  const data = [
    { name: 'Employee Allocated', value: employeeTotal, color: '#2563eb' },
    { name: 'Company Allocated', value: companyTotal, color: 'var(--color-primary)' },
  ].filter((d) => d.value > 0)

  const total = employeeTotal + companyTotal
  if (total === 0) return <EmptyChart />

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value} assets`, '']}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex flex-col gap-2 flex-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="text-sm text-[var(--color-text-secondary)]">{d.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--color-text)]">{d.value}</span>
              <span className="text-xs text-[var(--color-text-secondary)] w-10 text-right">
                {Math.round((d.value / total) * 100)}%
              </span>
            </div>
          </div>
        ))}
        <div className="border-t border-[var(--color-border)] pt-1.5 mt-0.5 flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-secondary)]">Total</span>
          <span className="text-sm font-bold text-[var(--color-text)]">{total}</span>
        </div>
      </div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-40 text-sm text-[var(--color-text-secondary)]">
      No data available
    </div>
  )
}
