import { getAuthenticatedUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { user } = await getAuthenticatedUser(event)

  let config = await prisma.reminderConfig.findUnique({
    where: { userId: user.id }
  })

  if (!config) {
    config = {
      id: '',
      enabled: false,
      intervalMinutes: 1,
      userId: user.id,
      updatedAt: new Date()
    }
  }

  return {
    enabled: config.enabled,
    intervalMinutes: config.intervalMinutes
  }
})
