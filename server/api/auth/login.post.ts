import {
  createExpiryDate,
  createToken,
  ensureDefaultAdmin,
  hashToken,
  toAuthUser,
  verifyPassword
} from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  await ensureDefaultAdmin()

  const body = await readBody<{ username?: string, password?: string }>(event)
  const username = body.username?.trim()
  const password = body.password

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: '请输入账号和密码' })
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      passwordHash: true,
      avatarUrl: true,
      mustResetPassword: true
    }
  })
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: '账号或密码错误' })
  }

  const token = createToken()
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: createExpiryDate()
    }
  })

  return {
    token,
    user: toAuthUser(user)
  }
})
