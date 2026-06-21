/**
 * Axios client with credentials and base URL configuration.
 * All API calls go through this instance.
 */
import axios from 'axios'

import { useAuthStore } from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Send cookies for JWT auth
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor: redirect to login on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect on login or register requests
      const requestUrl = error.config?.url || ''
      const isAuthRoute = requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/register')
      
      if (!isAuthRoute) {
        // Clear local auth state and redirect to login
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)



export default apiClient
