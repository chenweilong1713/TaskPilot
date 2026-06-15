import { getAuthenticatedUser } from '../utils/auth'

const publicApiPrefixes = [
  '/api/auth/login'
]

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  if (!path.startsWith('/api/')) return
  if (publicApiPrefixes.some((prefix) => path.startsWith(prefix))) return

  const { user } = await getAuthenticatedUser(event)

  if (user.mustResetPassword && !path.startsWith('/api/auth/reset-password') && !path.startsWith('/api/auth/me')) {
    throw createError({ statusCode: 403, statusMessage: '首次登录请先重置密码' })
  }

  event.context.auth = {
    userId: user.id,
    username: user.username,
    mustResetPassword: user.mustResetPassword
  }
})
