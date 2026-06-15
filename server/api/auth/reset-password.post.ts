import { getAuthenticatedUser, hashPassword, toAuthUser, verifyPassword } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { user } = await getAuthenticatedUser(event)
  const body = await readBody<{ username?: string, oldPassword?: string, newPassword?: string }>(event)
  const username = body.username?.trim()
  const oldPassword = body.oldPassword ?? ''
  const newPassword = body.newPassword ?? ''

  if (!username || username.length < 3) {
    throw createError({ statusCode: 400, statusMessage: '新账号至少 3 位' })
  }

  if (!verifyPassword(oldPassword, user.passwordHash)) {
    throw createError({ statusCode: 400, statusMessage: '原密码不正确' })
  }

  if (newPassword.length < 6) {
    throw createError({ statusCode: 400, statusMessage: '新密码至少 6 位' })
  }

  if (newPassword === oldPassword) {
    throw createError({ statusCode: 400, statusMessage: '新密码不能与原密码相同' })
  }

  const existingUser = await prisma.user.findUnique({ where: { username } })
  if (existingUser && existingUser.id !== user.id) {
    throw createError({ statusCode: 400, statusMessage: '账号已存在' })
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      username,
      passwordHash: hashPassword(newPassword),
      mustResetPassword: false
    }
  })

  return {
    user: toAuthUser(updatedUser)
  }
})
