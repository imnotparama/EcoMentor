import apiClient from './client'
import type { Challenge } from './types'

export const challengesApi = {
  getAll: async (): Promise<Challenge[]> => {
    const res = await apiClient.get<Challenge[]>('/api/challenges')
    return res.data
  },

  getActive: async (): Promise<Challenge[]> => {
    const res = await apiClient.get<Challenge[]>('/api/challenges/active')
    return res.data
  },

  complete: async (challengeId: number): Promise<Challenge> => {
    const res = await apiClient.post<Challenge>(`/api/challenges/${challengeId}/complete`)
    return res.data
  },

  generate: async (): Promise<Challenge> => {
    const res = await apiClient.post<Challenge>('/api/challenges/generate')
    return res.data
  },
}
