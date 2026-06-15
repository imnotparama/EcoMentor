import { useState, useCallback } from 'react'
import { dashboardApi } from '@/api/dashboard'
import type { DashboardData } from '@/api/types'

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await dashboardApi.getDashboard()
      setData(result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { data, isLoading, error, refetch: fetch }
}
