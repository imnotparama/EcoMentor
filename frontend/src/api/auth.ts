import apiClient from './client'
import type { ProfileUpdate, TokenResponse, User } from './types'

export const authApi = {
  register: async (email: string, password: string, name: string): Promise<TokenResponse> => {
    const res = await apiClient.post<TokenResponse>('/api/auth/register', { email, password, name })
    return res.data
  },

  login: async (email: string, password: string): Promise<TokenResponse> => {
    const res = await apiClient.post<TokenResponse>('/api/auth/login', { email, password })
    return res.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout')
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>('/api/auth/me')
    return res.data
  },

  updateProfile: async (data: ProfileUpdate): Promise<User> => {
    const res = await apiClient.patch<User>('/api/auth/profile', data)
    return res.data
  },

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/api/auth/account')
  },
}
