import { getAuthenticatedUser, hashPassword, verifyPassword } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { user } = await getAuthenticatedUser(event)
  const body = await readBody<{ oldPassword?: string, newPassword?: string }>(event)
  const oldPassword = body.oldPassword ?? ''
  const newPassword = body.newPassword ?? ''

  if (!verifyPassword(oldPassword, user.passwordHash)) {
    throw createError({ statusCode: 400, statusMessage: '原密码不正确' })
  }

  if (newPassword.length < 6) {
    throw createError({ statusCode: 400, statusMessage: '新密码至少 6 位' })
  }

  if (newPassword === oldPassword) {
    throw createError({ statusCode: 400, statusMessage: '新密码不能与原密码相同' })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword) }
  })

  return { ok: true }
})
