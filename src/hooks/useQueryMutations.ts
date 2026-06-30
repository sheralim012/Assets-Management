import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/useAuth'
import type { QueryType, QueryPriority, QueryStatus } from '@/types/queries'

interface CreateQueryInput {
  query_type: QueryType
  asset_id?: string | null
  requested_category_slug?: string | null
  title: string
  description: string
  priority: QueryPriority
}

interface UpdateQueryInput {
  id: string
  title?: string
  description?: string
  priority?: QueryPriority
  asset_id?: string | null
  requested_category_slug?: string | null
}

export function useCreateQuery() {
  const qc = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (input: CreateQueryInput) => {
      if (!profile) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('asset_queries')
        .insert({
          employee_id: profile.id,
          query_type: input.query_type,
          asset_id: input.asset_id ?? null,
          requested_category_slug: input.requested_category_slug ?? null,
          title: input.title,
          description: input.description,
          priority: input.priority,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['queries'] })
    },
  })
}

export function useUpdateQuery() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateQueryInput) => {
      const { id, ...updates } = input
      const { error } = await supabase
        .from('asset_queries')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['queries'] })
      qc.invalidateQueries({ queryKey: ['queries', vars.id] })
    },
  })
}

export function useDeleteQuery() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (queryId: string) => {
      const { error } = await supabase
        .from('asset_queries')
        .delete()
        .eq('id', queryId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['queries'] })
    },
  })
}

export function useChangeQueryStatus() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ queryId, status }: { queryId: string; status: QueryStatus }) => {
      const { error } = await supabase
        .from('asset_queries')
        .update({ status })
        .eq('id', queryId)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['queries'] })
      qc.invalidateQueries({ queryKey: ['queries', vars.queryId] })
      qc.invalidateQueries({ queryKey: ['query-comments', vars.queryId] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useAddComment() {
  const qc = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async ({ queryId, body }: { queryId: string; body: string }) => {
      if (!profile) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('query_comments')
        .insert({
          query_id: queryId,
          author_id: profile.id,
          body,
          is_system_message: false,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['query-comments', vars.queryId] })
      qc.invalidateQueries({ queryKey: ['queries'] })
    },
  })
}
