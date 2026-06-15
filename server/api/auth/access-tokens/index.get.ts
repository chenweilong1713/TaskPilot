import { getAuthenticatedUser } from '../../../utils/auth'
import { toAccessTokenView } from '../../../utils/accessTokens'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { user } = await getAuthenticatedUser(event)
  const tokens = await prisma.accessToken.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  })

  return tokens.map(toAccessTokenView)
})
