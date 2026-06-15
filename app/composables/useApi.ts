export function useApi() {
  const auth = useAuthStore()
  const toast = useToastStore()

  return $fetch.create({
    onRequest({ options }) {
      if (!auth.token) return

      options.headers = new Headers(options.headers)
      options.headers.set('Authorization', `Bearer ${auth.token}`)
    },
    async onResponseError({ response }) {
      const message = getApiErrorMessage(response._data)
      if (message) {
        toast.error(message)
      }

      if (response.status === 401) {
        await auth.clearAuth()
        await navigateTo('/login')
      }
    }
  })
}

function getApiErrorMessage(data: unknown) {
  if (typeof data === 'object' && data) {
    const payload = data as { statusMessage?: string, message?: string }
    return payload.statusMessage ?? payload.message ?? '请求失败'
  }
  return '请求失败'
}
