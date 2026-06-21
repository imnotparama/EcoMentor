import { useCallback } from 'react'
import { useAsyncResource } from './useAsyncResource'
import { assessmentApi } from '@/api/assessment'
import type { Assessment } from '@/api/types'

export function useAssessment() {
  const { data: assessment, isLoading, error, execute, setData } = useAsyncResource<Assessment>(
    () => assessmentApi.getCurrent()
  )

  const loadCurrent = useCallback(async () => {
    try {
      await execute()
    } catch {
      setData(null)
    }
  }, [execute, setData])

  const complete = useCallback(async () => {
    const result = await assessmentApi.complete()
    setData(result)
    return result
  }, [setData])

  return { assessment, isLoading, error, loadCurrent, complete }
}
