import { getAuthenticatedUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { session } = await getAuthenticatedUser(event)
  if (session) {
    await prisma.session.delete({ where: { id: session.id } })
  }
  return { ok: true }
})
