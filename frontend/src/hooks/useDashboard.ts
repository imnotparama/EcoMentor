import { useAsyncResource } from './useAsyncResource'
import { dashboardApi } from '@/api/dashboard'
import type { DashboardData } from '@/api/types'

export function useDashboard() {
  const { data, isLoading, error, execute: refetch } = useAsyncResource<DashboardData>(
    () => dashboardApi.getDashboard()
  )

  return { data, isLoading, error, refetch }
}
