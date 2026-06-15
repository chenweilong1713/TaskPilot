import { getAuthenticatedUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { user } = await getAuthenticatedUser(event)
  const body = await readBody<{ enabled?: boolean; intervalMinutes?: number }>(event)

  if (body.intervalMinutes !== undefined) {
    if (typeof body.intervalMinutes !== 'number' || body.intervalMinutes < 0.5 || body.intervalMinutes > 1440) {
      throw createError({ statusCode: 400, statusMessage: '检测间隔需在 0.5 ~ 1440 分钟之间' })
    }
  }

  const config = await prisma.reminderConfig.upsert({
    where: { userId: user.id },
    create: {
      enabled: body.enabled ?? false,
      intervalMinutes: body.intervalMinutes ?? 1,
      userId: user.id
    },
    update: {
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
      ...(body.intervalMinutes !== undefined ? { intervalMinutes: body.intervalMinutes } : {})
    }
  })

  return {
    enabled: config.enabled,
    intervalMinutes: config.intervalMinutes
  }
})
