import { getAuthenticatedUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { user } = await getAuthenticatedUser(event)
  const webhooks = await prisma.webhook.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  })

  return webhooks.map((w) => ({
    id: w.id,
    title: w.title,
    url: w.url,
    createdAt: w.createdAt.toISOString()
  }))
})
