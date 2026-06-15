export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const auth = useAuthStore()
  await auth.initialize()

  if (to.path === '/login') {
    if (auth.isAuthenticated && !auth.mustResetPassword) {
      return navigateTo('/')
    }
    return
  }

  if (!auth.isAuthenticated) {
    return navigateTo('/login')
  }

  if (auth.mustResetPassword) {
    return navigateTo('/login')
  }
})
