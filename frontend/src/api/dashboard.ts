import apiClient from './client'
import type { DashboardData } from './types'

export const dashboardApi = {
  getDashboard: async (): Promise<DashboardData> => {
    const res = await apiClient.get<DashboardData>('/api/dashboard')
    return res.data
  },
}
