import apiClient from './client'
import type { ProgressData } from './types'

export const progressApi = {
  getProgress: async (): Promise<ProgressData> => {
    const res = await apiClient.get<ProgressData>('/api/progress')
    return res.data
  },

  exportData: async (): Promise<void> => {
    const res = await apiClient.get('/api/progress/export', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'ecomentor_export.json')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
