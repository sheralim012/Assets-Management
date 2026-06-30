import { useQuery as useReactQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface EmployeeCategory {
  slug: string
  name: string
}

/**
 * Fetch employee-allocated asset categories.
 * Used in the "New Asset Request" query form for category selection.
 */
export function useEmployeeCategories() {
  return useReactQuery<EmployeeCategory[]>({
    queryKey: ['employee-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_categories')
        .select('slug, name')
        .eq('classification', 'employee_allocated')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return (data ?? []) as EmployeeCategory[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
