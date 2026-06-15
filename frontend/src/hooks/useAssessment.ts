import { useState, useCallback } from 'react'
import { assessmentApi } from '@/api/assessment'
import type { Assessment } from '@/api/types'

export function useAssessment() {
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCurrent = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await assessmentApi.getCurrent()
      setAssessment(data)
    } catch {
      setAssessment(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const complete = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await assessmentApi.complete()
      setAssessment(result)
      return result
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete assessment'
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { assessment, isLoading, error, loadCurrent, complete }
}
