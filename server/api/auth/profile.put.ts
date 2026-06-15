import { getAuthenticatedUser, toAuthUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { user } = await getAuthenticatedUser(event)
  const body = await readBody<{ avatarUrl?: string | null }>(event)
  const avatarUrl = typeof body.avatarUrl === 'string' && body.avatarUrl.trim()
    ? body.avatarUrl.trim()
    : null

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl }
  })

  return {
    user: toAuthUser(updatedUser)
  }
})
