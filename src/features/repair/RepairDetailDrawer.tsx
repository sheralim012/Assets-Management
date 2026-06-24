import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Pencil } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { UserSelectDropdown } from '@/components/ui/UserSelectDropdown'
import { RepairStatusBadge } from '@/components/shared/RepairStatusBadge'
import { ASSET_TYPE_LABELS, DAMAGE_CAUSE_OPTIONS } from '@/lib/constants'
import { formatDate, formatPKR, daysAgo } from '@/lib/utils'
import { useUpdateRepair } from '@/hooks/useRepairs'
import { useUsers } from '@/hooks/useUsers'
import type { RepairRecord, DamageCause, RepairStatus } from '@/types'

interface RepairDetailDrawerProps {
  repair: RepairRecord | null
  open: boolean
  onClose: () => void
}

interface EditState {
  fault_description: string
  repair_vendor_name: string
  repair_vendor_phone: string
  damage_cause: DamageCause
  date_sent: string
  expected_return_date: string
  estimated_cost_pkr: string
  final_cost_pkr: string
  status: RepairStatus
  original_user_id: string | null
}

const STATUS_OPTIONS: { value: RepairStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'completed', label: 'Completed' },
  { value: 'vendor_unresponsive', label: 'Vendor Unresponsive' },
]

function toEditState(r: RepairRecord): EditState {
  return {
    fault_description: r.fault_description ?? '',
    repair_vendor_name: r.repair_vendor_name ?? '',
    repair_vendor_phone: r.repair_vendor_phone ?? '',
    damage_cause: r.damage_cause ?? 'unknown',
    date_sent: r.date_sent ?? '',
    expected_return_date: r.expected_return_date ?? '',
    estimated_cost_pkr: r.estimated_cost_pkr != null ? String(r.estimated_cost_pkr) : '',
    final_cost_pkr: r.final_cost_pkr != null ? String(r.final_cost_pkr) : '',
    status: r.status,
    original_user_id: r.original_user_id ?? null,
  }
}

export function RepairDetailDrawer({ repair, open, onClose }: RepairDetailDrawerProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<EditState | null>(repair ? toEditState(repair) : null)
  const updateRepair = useUpdateRepair()
  const { data: users } = useUsers({ status: 'active' })

  useEffect(() => {
    if (repair) setForm(toEditState(repair))
    setEditing(false)
  }, [repair?.id])

  if (!repair || !form) return null
  const days = daysAgo(repair.date_sent)

  function update<K extends keyof EditState>(key: K, value: EditState[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f))
  }

  async function handleSave() {
    if (!form) return
    if (!form.fault_description.trim()) {
      toast.error('Fault description is required')
      return
    }
    try {
      await updateRepair.mutateAsync({
        repairId: repair!.id,
        values: {
          fault_description: form.fault_description,
          repair_vendor_name: form.repair_vendor_name,
          repair_vendor_phone: form.repair_vendor_phone,
          damage_cause: form.damage_cause,
          date_sent: form.date_sent,
          expected_return_date: form.expected_return_date,
          estimated_cost_pkr: form.estimated_cost_pkr === '' ? null : Number(form.estimated_cost_pkr),
          final_cost_pkr: form.final_cost_pkr === '' ? null : Number(form.final_cost_pkr),
          status: form.status,
          original_user_id: form.original_user_id,
        },
      })
      toast.success('Repair record updated')
      setEditing(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update repair')
    }
  }

  function handleCancel() {
    if (repair) setForm(toEditState(repair))
    setEditing(false)
  }

  return (
    <Drawer
      open={open}
      onClose={() => { setEditing(false); onClose() }}
      title="Repair Details"
      width={480}
    >
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">Repair Info</h3>
            {!editing && (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Button>
            )}
          </div>

          {!editing ? (
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
              {repair.actual_return_date && (
                <Row label="Actual Return" value={formatDate(repair.actual_return_date)} />
              )}
              {repair.resolved_status && (
                <Row label="Resolved Status" value={repair.resolved_status} />
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <UserSelectDropdown
                label="Responsible User"
                profiles={users ?? []}
                value={form.original_user_id ?? ''}
                onSelect={(uid) => update('original_user_id', uid || null)}
              />
              <Textarea
                label="Fault Description *"
                rows={3}
                value={form.fault_description}
                onChange={(e) => update('fault_description', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Vendor Name"
                  value={form.repair_vendor_name}
                  onChange={(e) => update('repair_vendor_name', e.target.value)}
                />
                <Input
                  label="Vendor Phone"
                  value={form.repair_vendor_phone}
                  onChange={(e) => update('repair_vendor_phone', e.target.value)}
                />
              </div>
              <Select
                label="Damage Cause"
                options={DAMAGE_CAUSE_OPTIONS}
                value={form.damage_cause}
                onValueChange={(v) => update('damage_cause', v as DamageCause)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Date Sent"
                  type="date"
                  value={form.date_sent}
                  onChange={(e) => update('date_sent', e.target.value)}
                />
                <Input
                  label="Expected Return"
                  type="date"
                  value={form.expected_return_date}
                  onChange={(e) => update('expected_return_date', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Estimated Cost (PKR)"
                  type="number"
                  min={0}
                  value={form.estimated_cost_pkr}
                  onChange={(e) => update('estimated_cost_pkr', e.target.value)}
                />
                <Input
                  label="Final Cost (PKR)"
                  type="number"
                  min={0}
                  value={form.final_cost_pkr}
                  onChange={(e) => update('final_cost_pkr', e.target.value)}
                />
              </div>
              <Select
                label="Status"
                options={STATUS_OPTIONS}
                value={form.status}
                onValueChange={(v) => update('status', v as RepairStatus)}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={handleCancel} disabled={updateRepair.isPending}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} loading={updateRepair.isPending}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
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
