import { useState, useCallback } from 'react'
import { challengesApi } from '@/api/challenges'
import type { Challenge } from '@/api/types'

export function useChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await challengesApi.getAll()
      setChallenges(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load challenges')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const complete = useCallback(async (id: number) => {
    try {
      const updated = await challengesApi.complete(id)
      setChallenges((prev) => prev.map((c) => (c.id === id ? updated : c)))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete challenge')
    }
  }, [])

  const generate = useCallback(async () => {
    try {
      const newChallenge = await challengesApi.generate()
      setChallenges((prev) => [newChallenge, ...prev])
      return newChallenge
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate challenge')
    }
  }, [])

  return { challenges, isLoading, error, load, complete, generate }
}
