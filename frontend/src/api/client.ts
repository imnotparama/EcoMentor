/**
 * Axios client with credentials and base URL configuration.
 * All API calls go through this instance.
 */
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Send cookies for JWT auth
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  failedQueue = []
}

// Response interceptor: refresh-then-retry on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const requestUrl: string = originalRequest?.url || ''
    const isAuthRoute =
      requestUrl.includes('/api/auth/login') ||
      requestUrl.includes('/api/auth/register') ||
      requestUrl.includes('/api/auth/refresh')

    if (error.response?.status === 401 && !isAuthRoute && !originalRequest._retry) {
      originalRequest._retry = true
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(apiClient(originalRequest)),
            reject: (err: any) => reject(err),
          })
        })
      }

      isRefreshing = true

      return new Promise((resolve, reject) => {
        apiClient.post('/api/auth/refresh')
          .then(() => {
            isRefreshing = false
            resolve(apiClient(originalRequest))
            processQueue(null)
          })
          .catch((err) => {
            isRefreshing = false
            processQueue(err)
            useAuthStore.getState().logout()
            window.location.href = '/login'
            reject(err)
          })
      })
    }
    return Promise.reject(error)
  }
)

export default apiClient
