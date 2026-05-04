import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/useAuth'
import type { Profile, AuditAction } from '@/types'

export interface UserAuditEntry {
  id: string
  asset_id: string
  action: AuditAction
  created_at: string
  asset: { asset_tag: string; asset_type: string } | null
}

interface UserFilter {
  status?: 'active' | 'inactive'
  search?: string
}

export interface ProfileWithAssetCount extends Profile {
  asset_count: number
}

export function useUsers(filter: UserFilter = {}) {
  return useQuery<ProfileWithAssetCount[]>({
    queryKey: ['users', filter],
    queryFn: async () => {
      let q = supabase.from('profiles').select('*').order('name')

      if (filter.status) q = q.eq('status', filter.status)
      if (filter.search) {
        q = q.or(`name.ilike.%${filter.search}%,email.ilike.%${filter.search}%`)
      }

      const { data: profiles, error } = await q
      if (error) throw error

      const { data: assets } = await supabase
        .from('assets')
        .select('allotted_user_id')
        .not('allotted_user_id', 'is', null)
        .neq('status', 'retired')

      const countMap: Record<string, number> = {}
      for (const a of assets ?? []) {
        if (a.allotted_user_id) {
          countMap[a.allotted_user_id] = (countMap[a.allotted_user_id] ?? 0) + 1
        }
      }

      return (profiles ?? []).map((p) => ({ ...p, asset_count: countMap[p.id] ?? 0 }))
    },
    staleTime: 0,
    gcTime: 0,
  })
}

export function useUserAssets(userId: string | null) {
  return useQuery({
    queryKey: ['user-assets', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('allotted_user_id', userId!)
        .neq('status', 'retired')
      if (error) throw error
      return data ?? []
    },
    enabled: !!userId,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  const { profile: currentProfile } = useAuth()
  return useMutation({
    mutationFn: async (values: {
      name: string
      email: string
      role: Profile['role']
      designation?: string | null
    }) => {
      if (currentProfile?.role !== 'admin') throw new Error('Admin access required')
      const { error } = await supabase.from('profiles').insert({
        ...values,
        status: 'active',
        avatar_url: null,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  const { profile: currentProfile } = useAuth()
  return useMutation({
    mutationFn: async (id: string) => {
      if (currentProfile?.role !== 'admin') {
        toast.error('Only admins can delete employees')
        throw new Error('PERMISSION_DENIED')
      }

      await supabase
        .from('assets')
        .update({ allotted_user_id: null, status: 'available' })
        .eq('allotted_user_id', id)
        .neq('status', 'retired')

      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) {
        console.error('Delete error:', error)
        toast.error('Failed to delete: ' + error.message)
        throw error
      }
    },
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: ['users'] })
      qc.removeQueries({ queryKey: ['user-assets', id] })
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

export function useUserAuditLog(userId: string | null) {
  return useQuery<UserAuditEntry[]>({
    queryKey: ['user-audit', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_audit_log')
        .select('id, asset_id, action, created_at, asset:assets!asset_id(asset_tag, asset_type)')
        .eq('actor_id', userId!)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return (data ?? []) as unknown as UserAuditEntry[]
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  const { profile: currentProfile } = useAuth()
  return useMutation({
    mutationFn: async ({ id, values }: {
      id: string
      values: {
        name: string
        role: 'admin' | 'employee'
        designation?: string | null
        status: 'active' | 'inactive'
      }
    }) => {
      if (currentProfile?.role !== 'admin') throw new Error('Admin access required')
      const { error } = await supabase.from('profiles').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}
