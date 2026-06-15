import apiClient from './client'
import type { ChatMessage, ChatResponse } from './types'

export const chatApi = {
  sendMessage: async (message: string): Promise<ChatResponse> => {
    const res = await apiClient.post<ChatResponse>('/api/chat', { message })
    return res.data
  },

  getHistory: async (): Promise<ChatMessage[]> => {
    const res = await apiClient.get<ChatMessage[]>('/api/chat/history')
    return res.data
  },

  clearHistory: async (): Promise<void> => {
    await apiClient.delete('/api/chat/history')
  },
}
