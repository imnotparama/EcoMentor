import apiClient from './client'
import type { ProgressData } from './types'

export const progressApi = {
  getProgress: async (): Promise<ProgressData> => {
    const res = await apiClient.get<ProgressData>('/api/progress')
    return res.data
  },

  exportData: (): void => {
    // Trigger browser download of export JSON
    window.open(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/progress/export`,
      '_blank'
    )
  },
}
