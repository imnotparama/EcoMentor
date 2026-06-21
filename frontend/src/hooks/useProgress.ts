import { useCallback } from 'react'
import { useAsyncResource } from './useAsyncResource'
import { progressApi } from '@/api/progress'
import type { ProgressData } from '@/api/types'

export function useProgress() {
  const { data, isLoading, error, execute: load } = useAsyncResource<ProgressData>(
    () => progressApi.getProgress()
  )

  const exportData = useCallback(async () => {
    try {
      await progressApi.exportData()
    } catch (err: unknown) {
      console.error('Failed to export data:', err)
    }
  }, [])

  return { data, isLoading, error, load, exportData }
}
