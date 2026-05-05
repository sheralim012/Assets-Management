import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface CategoryStats {
  type_key: string
  label: string
  tag_prefix: string
  classification: 'employee_allocated' | 'company_allocated'
  icon?: string
  total: number
  available: number
  allotted: number
  in_repair: number
  total_value: number
  available_value: number
  allotted_value: number
}

export interface DashboardStats {
  employee: CategoryStats[]
  company: CategoryStats[]
  combined: {
    total: number
    total_value: number
    available: number
    allotted: number
    in_repair: number
    employee_total: number
    company_total: number
    employee_value: number
    company_value: number
  }
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [{ data: assets, error: assetsErr }, { data: categories, error: catErr }] =
        await Promise.all([
          supabase
            .from('assets')
            .select('asset_type, status, price_pkr, classification')
            .neq('status', 'retired'),
          supabase
            .from('asset_categories')
            .select('name, slug, classification, tag_prefix, icon, is_active, sort_order')
            .order('classification', { ascending: true })
            .order('sort_order', { ascending: true }),
        ])

      if (assetsErr) throw assetsErr
      if (catErr) throw catErr

      const catMap = new Map<string, CategoryStats>()

      for (const cat of categories ?? []) {
        const key = cat.slug ?? ''
        catMap.set(key, {
          type_key: key,
          label: cat.name ?? key,
          tag_prefix: cat.tag_prefix ?? '',
          classification: (cat.classification ?? 'employee_allocated') as CategoryStats['classification'],
          icon: cat.icon ?? undefined,
          total: 0,
          available: 0,
          allotted: 0,
          in_repair: 0,
          total_value: 0,
          available_value: 0,
          allotted_value: 0,
        })
      }

      for (const asset of assets ?? []) {
        let entry = catMap.get(asset.asset_type)
        if (!entry) {
          entry = {
            type_key: asset.asset_type,
            label: asset.asset_type.replace(/_/g, ' '),
            tag_prefix: '',
            classification: (asset.classification ?? 'employee_allocated') as CategoryStats['classification'],
            total: 0, available: 0, allotted: 0, in_repair: 0,
            total_value: 0, available_value: 0, allotted_value: 0,
          }
          catMap.set(asset.asset_type, entry)
        }

        const price = asset.price_pkr ?? 0
        entry.total++
        entry.total_value += price

        if (asset.status === 'available') {
          entry.available++
          entry.available_value += price
        } else if (asset.status === 'allotted') {
          entry.allotted++
          entry.allotted_value += price
        } else if (asset.status === 'in_repair') {
          entry.in_repair++
        }
      }

      const allStats = Array.from(catMap.values()).filter((c) => c.total > 0)
      const employee = allStats.filter((c) => c.classification === 'employee_allocated')
      const company = allStats.filter((c) => c.classification === 'company_allocated')

      const sum = (arr: CategoryStats[], key: keyof CategoryStats) =>
        arr.reduce((s, c) => s + (c[key] as number), 0)

      return {
        employee,
        company,
        combined: {
          total: sum(allStats, 'total'),
          total_value: sum(allStats, 'total_value'),
          available: sum(allStats, 'available'),
          allotted: sum(allStats, 'allotted'),
          in_repair: sum(allStats, 'in_repair'),
          employee_total: sum(employee, 'total'),
          company_total: sum(company, 'total'),
          employee_value: sum(employee, 'total_value'),
          company_value: sum(company, 'total_value'),
        },
      }
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  })
}
