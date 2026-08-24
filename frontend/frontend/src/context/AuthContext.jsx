import { createContext, useContext, useEffect, useState } from 'react'
import {
  clearStoredTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredTokens,
} from '../api/http'
import {
  getProfileRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
} from '../api/endpoints'

const AuthContext = createContext(null)

async function hydrateUser() {
  const profile = await getProfileRequest()
  return profile
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      const hasTokens = getStoredAccessToken() || getStoredRefreshToken()

      if (!hasTokens) {
        if (!cancelled) {
          setBootstrapping(false)
        }
        return
      }

      try {
        const profile = await hydrateUser()

        if (!cancelled) {
          setUser(profile)
        }
      } catch {
        clearStoredTokens()
        if (!cancelled) {
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false)
        }
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [])

  async function persistSession(authData) {
    setStoredTokens({ access: authData.access, refresh: authData.refresh })
    const profile = await hydrateUser()
    setUser(profile)
    return profile
  }

  async function login(credentials) {
    const response = await loginRequest(credentials)
    return persistSession(response)
  }

  async function register(credentials) {
    const response = await registerRequest(credentials)
    return persistSession(response)
  }

  async function logout() {
    const refresh = getStoredRefreshToken()

    try {
      if (refresh) {
        await logoutRequest(refresh)
      }
    } finally {
      clearStoredTokens()
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        bootstrapping,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
