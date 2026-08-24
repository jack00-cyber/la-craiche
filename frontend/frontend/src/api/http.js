import axios from 'axios'

const ACCESS_KEY = 'la_craiche_access_token'
const REFRESH_KEY = 'la_craiche_refresh_token'

function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '')

  if (import.meta.env.DEV) {
    return '/api'
  }

  if (configuredUrl) {
    return `${configuredUrl}/api`
  }

  return '/api'
}

export function getStoredAccessToken() {
  return window.localStorage.getItem(ACCESS_KEY)
}

export function getStoredRefreshToken() {
  return window.localStorage.getItem(REFRESH_KEY)
}

export function setStoredTokens({ access, refresh }) {
  if (access) {
    window.localStorage.setItem(ACCESS_KEY, access)
  }

  if (refresh) {
    window.localStorage.setItem(REFRESH_KEY, refresh)
  }
}

export function clearStoredTokens() {
  window.localStorage.removeItem(ACCESS_KEY)
  window.localStorage.removeItem(REFRESH_KEY)
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 20000,
})

const refreshClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken()

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const refreshToken = getStoredRefreshToken()

    if (
      error.response?.status === 401 &&
      refreshToken &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true

      try {
        const refreshResponse = await refreshClient.post('/token/refresh/', {
          refresh: refreshToken,
        })

        const newAccessToken = refreshResponse.data?.access

        if (newAccessToken) {
          setStoredTokens({ access: newAccessToken })
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

          return api(originalRequest)
        }
      } catch (refreshError) {
        clearStoredTokens()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default api
