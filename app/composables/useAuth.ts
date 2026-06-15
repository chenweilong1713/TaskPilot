import { defineStore } from 'pinia'
import type { AuthUser, LoginResponse } from '~/types/auth'

const tokenStorageKey = 'taskpilot_token'
const userStorageKey = 'taskpilot_user'
const fallbackAvatarUrl = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80'
const sessionMaxAge = 60 * 60 * 24 * 7

export const useAuthStore = defineStore('auth', () => {
  const tokenCookie = useCookie<string | null>(tokenStorageKey, {
    default: () => null,
    maxAge: sessionMaxAge,
    sameSite: 'lax',
    path: '/'
  })
  const userCookie = useCookie<AuthUser | null>(userStorageKey, {
    default: () => null,
    maxAge: sessionMaxAge,
    sameSite: 'lax',
    path: '/'
  })
  const token = ref<string | null>(tokenCookie.value)
  const user = ref<AuthUser | null>(userCookie.value)
  const initialized = ref(false)
  let initializePromise: Promise<void> | null = null

  const isAuthenticated = computed(() => Boolean(token.value && user.value))
  const mustResetPassword = computed(() => Boolean(user.value?.mustResetPassword))
  const avatarUrl = computed(() => user.value?.avatarUrl || fallbackAvatarUrl)

  function setAuth(payload: LoginResponse) {
    token.value = payload.token
    tokenCookie.value = payload.token
    setUser(payload.user)
    if (import.meta.client) {
      localStorage.setItem(tokenStorageKey, payload.token)
    }
  }

  function setUser(nextUser: AuthUser) {
    user.value = {
      ...nextUser,
      avatarUrl: nextUser.avatarUrl || null
    }
    userCookie.value = user.value
    if (import.meta.client) {
      localStorage.setItem(userStorageKey, JSON.stringify(user.value))
    }
  }

  async function clearAuth() {
    token.value = null
    user.value = null
    tokenCookie.value = null
    userCookie.value = null
    if (import.meta.client) {
      localStorage.removeItem(tokenStorageKey)
      localStorage.removeItem(userStorageKey)
    }
  }

  async function initialize() {
    if (initialized.value) return
    if (initializePromise) return initializePromise

    initializePromise = hydrateAuth()
    await initializePromise
  }

  async function hydrateAuth() {
    const storedToken = tokenCookie.value || (import.meta.client ? localStorage.getItem(tokenStorageKey) : null)
    if (!storedToken) {
      initialized.value = true
      initializePromise = null
      return
    }

    token.value = storedToken
    if (!tokenCookie.value) {
      tokenCookie.value = storedToken
    }

    const storedUser = userCookie.value || readStoredUser()
    if (storedUser) {
      setUser(storedUser)
    }

    try {
      const response = await useApi()<{ user: AuthUser }>('/api/auth/me')
      setUser(response.user)
    } catch {
      await clearAuth()
    } finally {
      initialized.value = true
      initializePromise = null
    }
  }

  function readStoredUser() {
    if (!import.meta.client) return null

    const storedUser = localStorage.getItem(userStorageKey)
    if (!storedUser) return null

    try {
      return JSON.parse(storedUser) as AuthUser
    } catch {
      localStorage.removeItem(userStorageKey)
      return null
    }
  }

  async function login(username: string, password: string) {
    const response = await $fetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { username, password }
    })
    setAuth(response)
    return response
  }

  async function resetPassword(username: string, oldPassword: string, newPassword: string) {
    const response = await useApi()<{ user: AuthUser }>('/api/auth/reset-password', {
      method: 'POST',
      body: { username, oldPassword, newPassword }
    })
    setUser(response.user)
    return response
  }

  async function updateProfile(avatarUrl: string | null) {
    const response = await useApi()<{ user: AuthUser }>('/api/auth/profile', {
      method: 'PUT',
      body: { avatarUrl }
    })
    setUser(response.user)
    return response
  }

  async function uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await useApi()<{ user: AuthUser }>('/api/auth/avatar', {
      method: 'POST',
      body: formData
    })
    setUser(response.user)
    return response
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    return useApi()('/api/auth/change-password', {
      method: 'POST',
      body: { oldPassword, newPassword }
    })
  }

  async function logout() {
    try {
      if (token.value) {
        await useApi()('/api/auth/logout', { method: 'POST' })
      }
    } finally {
      await clearAuth()
      await navigateTo('/login')
    }
  }

  return {
    token,
    user,
    avatarUrl,
    initialized,
    isAuthenticated,
    mustResetPassword,
    initialize,
    login,
    resetPassword,
    updateProfile,
    uploadAvatar,
    changePassword,
    logout,
    clearAuth
  }
})
