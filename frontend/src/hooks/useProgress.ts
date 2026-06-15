import { useState, useCallback } from 'react'
import { progressApi } from '@/api/progress'
import type { ProgressData } from '@/api/types'

export function useProgress() {
  const [data, setData] = useState<ProgressData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await progressApi.getProgress()
      setData(result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load progress')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const exportData = useCallback(() => {
    progressApi.exportData()
  }, [])

  return { data, isLoading, error, load, exportData }
}
