import { Drawer } from '@/components/ui/Drawer'
import { RepairStatusBadge } from '@/components/shared/RepairStatusBadge'
import { ASSET_TYPE_LABELS } from '@/lib/constants'
import { formatDate, formatPKR, daysAgo } from '@/lib/utils'
import type { RepairRecord } from '@/types'

interface RepairDetailDrawerProps {
  repair: RepairRecord | null
  open: boolean
  onClose: () => void
}

export function RepairDetailDrawer({ repair, open, onClose }: RepairDetailDrawerProps) {
  if (!repair) return null
  const days = daysAgo(repair.date_sent)

  return (
    <Drawer open={open} onClose={onClose} title="Repair Details" width={480}>
      {repair && (
        <div className="px-6 py-4 space-y-5">
          <section>
            <h3 className="section-title mb-3">Asset</h3>
            {repair.asset && (
              <div className="p-3 bg-[var(--color-bg)] rounded-lg text-sm space-y-1">
                <p className="font-mono font-bold text-[var(--color-primary)]">{repair.asset.asset_tag}</p>
                <p className="text-[var(--color-text-secondary)]">{ASSET_TYPE_LABELS[repair.asset.asset_type]}</p>
                <p>{repair.asset.specs}</p>
              </div>
            )}
          </section>

          <section>
            <h3 className="section-title mb-3">Repair Info</h3>
            <div className="space-y-2">
              <Row label="Fault" value={repair.fault_description} />
              <Row label="Vendor" value={repair.repair_vendor_name} />
              <Row label="Vendor Phone" value={repair.repair_vendor_phone} />
              <Row label="Damage Cause" value={repair.damage_cause.replace(/_/g, ' ')} />
              <Row label="Date Sent" value={formatDate(repair.date_sent)} />
              <Row label="Expected Return" value={formatDate(repair.expected_return_date)} />
              <Row
                label="Days In Repair"
                value={
                  <span className={days >= 15 ? 'text-[var(--color-danger)] font-semibold' : days >= 8 ? 'text-amber-600 font-semibold' : ''}>
                    {days}d
                  </span>
                }
              />
              {repair.estimated_cost_pkr != null && <Row label="Estimated Cost" value={formatPKR(repair.estimated_cost_pkr)} />}
              {repair.final_cost_pkr != null && <Row label="Final Cost" value={formatPKR(repair.final_cost_pkr)} />}
              <Row label="Status" value={<RepairStatusBadge status={repair.status} />} />
            </div>
          </section>

          {repair.actual_return_date && (
            <Row label="Actual Return" value={formatDate(repair.actual_return_date)} />
          )}
          {repair.resolved_status && (
            <Row label="Resolved Status" value={repair.resolved_status} />
          )}
        </div>
      )}
    </Drawer>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-[var(--color-text-secondary)] w-36 flex-shrink-0">{label}</span>
      <span className="text-[var(--color-text)] flex-1">{value ?? '—'}</span>
    </div>
  )
}
