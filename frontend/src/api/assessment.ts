import apiClient from './client'
import type {
  Assessment,
  EnergyStep,
  FoodStep,
  Recommendation,
  ShoppingStep,
  TransportStep,
  WasteStep,
} from './types'

export const assessmentApi = {
  saveStep: async (data: {
    transport?: TransportStep
    energy?: EnergyStep
    food?: FoodStep
    shopping?: ShoppingStep
    waste?: WasteStep
  }): Promise<Assessment> => {
    const res = await apiClient.post<Assessment>('/api/assessment/save', data)
    return res.data
  },

  complete: async (): Promise<Assessment> => {
    const res = await apiClient.post<Assessment>('/api/assessment/complete')
    return res.data
  },

  getCurrent: async (): Promise<Assessment> => {
    const res = await apiClient.get<Assessment>('/api/assessment/current')
    return res.data
  },

  getDraft: async (): Promise<Assessment> => {
    const res = await apiClient.get<Assessment>('/api/assessment/draft')
    return res.data
  },

  getRecommendations: async (): Promise<Recommendation[]> => {
    const res = await apiClient.get<Recommendation[]>('/api/assessment/recommendations')
    return res.data
  },
}
