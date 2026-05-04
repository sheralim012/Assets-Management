import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AssetStatusBadge } from '@/components/shared/AssetStatusBadge'
import { AssetTypeIcon } from '@/components/shared/AssetTypeIcon'
import { OffboardingModal } from './OffboardingModal'
import { useUserAssets, useUserAuditLog } from '@/hooks/useUsers'
import { useAuth } from '@/features/auth/useAuth'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import type { Profile, UserRole } from '@/types'

interface UserDetailDrawerProps {
  profile: Profile | null
  open: boolean
  onClose: () => void
}

const roleBadgeVariant: Record<UserRole, 'admin' | 'manager' | 'finance' | 'employee'> = {
  admin: 'admin',
  manager: 'manager',
  finance: 'finance',
  employee: 'employee',
}

const ACTION_LABELS: Record<string, string> = {
  created: 'Asset added',
  updated: 'Asset updated',
  status_changed: 'Status changed',
  assigned: 'Asset assigned',
  returned: 'Asset returned',
  repair_opened: 'Sent to repair',
  repair_closed: 'Repair completed',
  retired: 'Asset retired',
}

export function UserDetailDrawer({ profile, open, onClose }: UserDetailDrawerProps) {
  const [offboardingOpen, setOffboardingOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { user: currentUser, profile: currentProfile } = useAuth()
  const qc = useQueryClient()
  const { data: assets } = useUserAssets(profile?.id ?? null)
  const { data: auditLog } = useUserAuditLog(profile?.id ?? null)

  if (!profile) return null

  const isSelf = currentUser?.id === profile.id

  async function handleDelete() {
    setDeleting(true)
    try {
      if (currentProfile?.role !== 'admin') {
        toast.error('Only admins can delete employees')
        return
      }

      await supabase
        .from('assets')
        .update({ allotted_user_id: null, status: 'available' })
        .eq('allotted_user_id', profile!.id)
        .neq('status', 'retired')

      const { error } = await supabase.from('profiles').delete().eq('id', profile!.id)
      if (error) {
        console.error('Delete error:', error)
        toast.error('Failed to delete: ' + error.message)
        return
      }

      qc.removeQueries({ queryKey: ['users'] })
      qc.removeQueries({ queryKey: ['user-assets', profile!.id] })
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['assets'] })

      toast.success(`${profile!.name} has been removed`)
      if (!profile!.manually_created) {
        toast('Note: This user signed in via Google — their auth account was not removed.', { icon: 'ℹ️' })
      }

      setDeleteOpen(false)
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== 'PERMISSION_DENIED') {
        toast.error(err instanceof Error ? err.message : 'Failed to delete user')
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Drawer open={open} onClose={onClose} title="User Details" width={480}>
        <div className="px-6 py-4 space-y-6">
          {/* Profile header */}
          <div className="flex items-start gap-4 p-4 bg-[var(--color-bg)] rounded-lg">
            <Avatar src={profile.avatar_url} name={profile.name} size="lg" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[var(--color-text)]">{profile.name}</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">{profile.email}</p>
              {profile.designation && (
                <p className="text-sm text-[var(--color-text-secondary)]">{profile.designation}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={roleBadgeVariant[profile.role]}>{profile.role}</Badge>
                <Badge variant={profile.status === 'active' ? 'available' : 'retired'}>
                  {profile.status}
                </Badge>
              </div>
            </div>
            {!isSelf && (
              <Tooltip content="Delete user">
                <button
                  className="p-1.5 rounded hover:bg-[var(--color-danger-light)] text-slate-400 hover:text-[var(--color-danger)] transition-colors flex-shrink-0"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </Tooltip>
            )}
          </div>

          {/* Assets */}
          <section>
            <h3 className="section-title mb-3">
              Assigned Assets
              {assets && assets.length > 0 && (
                <span className="ml-2 text-sm font-normal text-[var(--color-text-secondary)]">
                  ({assets.length})
                </span>
              )}
            </h3>
            {assets && assets.length > 0 ? (
              <div className="space-y-2">
                {assets.map((asset) => (
                  <div key={asset.id} className="flex items-center gap-3 p-3 bg-[var(--color-bg)] rounded-lg">
                    <AssetTypeIcon type={asset.asset_type} size={18} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[var(--color-primary)]">{asset.asset_tag}</span>
                        <AssetStatusBadge status={asset.status} />
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] truncate">{asset.specs}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)]">No assets assigned</p>
            )}
          </section>

          {/* Activity Log */}
          {auditLog && auditLog.length > 0 && (
            <section>
              <h3 className="section-title mb-3">Recent Activity</h3>
              <div className="space-y-2">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 p-3 bg-[var(--color-bg)] rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--color-text)]">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                        {entry.asset && (
                          <span className="ml-1 font-mono text-xs font-semibold text-[var(--color-primary)]">
                            {entry.asset.asset_tag}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {formatDateTime(entry.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Offboard / inactive notice */}
          {profile.status === 'inactive' ? (
            <div className="border-t border-[var(--color-border)] pt-4">
              <p className="text-sm text-[var(--color-text-secondary)] text-center">
                Marked inactive
                {profile.updated_at ? ` on ${formatDateTime(profile.updated_at)}` : ''}
              </p>
            </div>
          ) : (
            <div className="border-t border-[var(--color-border)] pt-4">
              <Button
                variant="danger"
                className="w-full justify-center"
                onClick={() => setOffboardingOpen(true)}
              >
                Mark as Inactive (Offboard)
              </Button>
            </div>
          )}
        </div>
      </Drawer>

      {offboardingOpen && (
        <OffboardingModal
          open={offboardingOpen}
          onClose={() => setOffboardingOpen(false)}
          profile={profile}
          onComplete={() => { setOffboardingOpen(false); onClose() }}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Employee"
        description={`Remove ${profile.name} from the system? This cannot be undone.${
          assets && assets.length > 0
            ? ` Their ${assets.length} asset(s) will be unlinked and set to available.`
            : ''
        }`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </>
  )
}
