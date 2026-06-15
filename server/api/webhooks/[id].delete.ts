import { getAuthenticatedUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { user } = await getAuthenticatedUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '缺少 Webhook ID' })
  }

  await prisma.webhook.deleteMany({
    where: {
      id,
      userId: user.id
    }
  })

  return { ok: true }
})
