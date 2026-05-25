import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCompleteRepair } from '@/hooks/useRepairs'
import { useUsers } from '@/hooks/useUsers'
import type { RepairRecord } from '@/types'
import { ASSET_TYPE_LABELS } from '@/lib/constants'

interface CompleteRepairModalProps {
  open: boolean
  onClose: () => void
  repair: RepairRecord
}

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'allotted', label: 'Allotted to Employee' },
  { value: 'retired', label: 'Retire (Beyond Repair)' },
]

export function CompleteRepairModal({ open, onClose, repair }: CompleteRepairModalProps) {
  const completeRepair = useCompleteRepair()
  const { data: users } = useUsers({ status: 'active' })

  const [finalCost, setFinalCost] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // User dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setFinalCost('')
      setNewStatus('')
      setSelectedUserId('')
      setError(null)
      setDropdownOpen(false)
      setSearch('')
    }
  }, [open])

  const profiles = (users ?? []).sort((a, b) => a.name.localeCompare(b.name))
  const filtered = profiles.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()),
  )
  const selectedUser = profiles.find((p) => p.id === selectedUserId)

  async function handleSubmit() {
    setError(null)
    if (!finalCost || parseFloat(finalCost) < 0) { setError('Final repair cost is required'); return }
    if (!newStatus) { setError('Please select a status'); return }
    if (newStatus === 'allotted' && !selectedUserId) { setError('Please select an employee'); return }
    setLoading(true)
    try {
      await completeRepair.mutateAsync({
        repairId: repair.id,
        assetId: repair.asset_id,
        finalCost,
        newStatus: newStatus as 'available' | 'allotted' | 'retired',
        allottedUserId: newStatus === 'allotted' ? selectedUserId : null,
      })
      toast.success('Repair marked complete')
      onClose()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Complete Repair"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Mark Complete
          </Button>
        </>
      }
    >
      {repair.asset && (
        <div className="mb-4 p-3 bg-[var(--color-available-light)] rounded-lg">
          <p className="text-sm font-semibold text-[var(--color-available)]">
            {repair.asset.asset_tag} — {ASSET_TYPE_LABELS[repair.asset.asset_type]}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{repair.fault_description}</p>
        </div>
      )}

      <div className="space-y-4">
        <Input
          label="Final Repair Cost (PKR) *"
          type="number"
          min={0}
          value={finalCost}
          onChange={(e) => setFinalCost(e.target.value)}
          placeholder="e.g. 5000"
        />

        {/* Status select */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">New Asset Status *</label>
          <select
            value={newStatus}
            onChange={(e) => { setNewStatus(e.target.value); setSelectedUserId(''); setError(null) }}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">Select status...</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Allotted To — custom scrollable dropdown */}
        {newStatus === 'allotted' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">Allotted To *</label>
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-left text-sm flex justify-between items-center bg-white hover:border-[var(--color-primary)] transition-colors"
              >
                <span className={selectedUser ? 'text-[var(--color-text)]' : 'text-[var(--color-text-secondary)]'}>
                  {selectedUser ? selectedUser.name : 'Select employee...'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>

              {dropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-[var(--color-border)] rounded-lg shadow-lg">
                  <div className="p-2 border-b border-[var(--color-border)]">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search by name or email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full text-sm px-2 py-1.5 border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {filtered.length === 0 && (
                      <div className="px-3 py-2 text-sm text-[var(--color-text-secondary)]">No employees found</div>
                    )}
                    {filtered.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedUserId(p.id)
                          setDropdownOpen(false)
                          setSearch('')
                          setError(null)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex flex-col border-b border-[var(--color-border)] last:border-0 ${p.id === selectedUserId ? 'bg-blue-50' : ''}`}
                      >
                        <span className="font-medium text-[var(--color-text)]">{p.name}</span>
                        <span className="text-xs text-[var(--color-text-secondary)]">{p.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {newStatus === 'retired' && (
          <div className="p-3 bg-[var(--color-danger-light)] rounded-lg text-sm text-[var(--color-danger)]">
            Asset will be permanently retired with reason: <strong>Beyond Repair</strong>.
          </div>
        )}

        {error && (
          <p className="text-xs text-[var(--color-danger)] font-medium">{error}</p>
        )}
      </div>
    </Modal>
  )
}
