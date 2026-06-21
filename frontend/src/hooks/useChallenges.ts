import { useCallback } from 'react'
import { useAsyncResource } from './useAsyncResource'
import { challengesApi } from '@/api/challenges'
import type { Challenge } from '@/api/types'

export function useChallenges() {
  const { data, isLoading, error, execute: load, setData } = useAsyncResource<Challenge[]>(
    () => challengesApi.getAll(),
    []
  )

  const complete = useCallback(async (id: number) => {
    try {
      const updated = await challengesApi.complete(id)
      setData((prev) => (prev || []).map((c) => (c.id === id ? updated : c)))
    } catch (err: unknown) {
      console.error(err)
    }
  }, [setData])

  const generate = useCallback(async () => {
    try {
      const newChallenge = await challengesApi.generate()
      setData((prev) => [newChallenge, ...(prev || [])])
      return newChallenge
    } catch (err: unknown) {
      console.error(err)
    }
  }, [setData])

  return { challenges: data || [], isLoading, error, load, complete, generate }
}
