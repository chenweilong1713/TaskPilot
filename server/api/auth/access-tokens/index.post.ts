import { createAccessSecret, getSecretPreview, toAccessTokenView } from '../../../utils/accessTokens'
import { getAuthenticatedUser, hashToken } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { user } = await getAuthenticatedUser(event)
  const body = await readBody<{ name?: string, secret?: string, expiresAt?: string | null }>(event)
  const name = body.name?.trim()
  const secret = body.secret?.trim() || createAccessSecret()
  const expiresAt = parseExpiry(body.expiresAt)

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: '令牌名称不能为空' })
  }

  if (secret.length < 12) {
    throw createError({ statusCode: 400, statusMessage: '秘钥至少 12 位' })
  }

  try {
    const token = await prisma.accessToken.create({
      data: {
        name,
        secret,
        secretHash: hashToken(secret),
        secretPreview: getSecretPreview(secret),
        userId: user.id,
        expiresAt
      }
    })

    return {
      token: toAccessTokenView(token),
      secret
    }
  } catch {
    throw createError({ statusCode: 400, statusMessage: '秘钥已存在，请更换后重试' })
  }
})

function parseExpiry(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw createError({ statusCode: 400, statusMessage: '过期时间无效' })
  }
  return date
}
