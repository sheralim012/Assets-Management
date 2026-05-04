import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/useAuth'
import type { Profile } from '@/types'

export function useProfile() {
  const { user } = useAuth()
  return useQuery<Profile>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle()
      if (error) throw error
      if (!data) throw new Error('Profile not found')
      return data
    },
    enabled: !!user,
  })
}
