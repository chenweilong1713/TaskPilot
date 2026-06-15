import { getAuthenticatedUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { user } = await getAuthenticatedUser(event)
  const body = await readBody<{ title?: string; url?: string }>(event)
  const title = body.title?.trim()
  const url = body.url?.trim()

  if (!title) {
    throw createError({ statusCode: 400, statusMessage: '标题不能为空' })
  }

  if (!url) {
    throw createError({ statusCode: 400, statusMessage: 'URL 不能为空' })
  }

  try {
    const webhook = await prisma.webhook.create({
      data: {
        title,
        url,
        userId: user.id
      }
    })

    return {
      id: webhook.id,
      title: webhook.title,
      url: webhook.url,
      createdAt: webhook.createdAt.toISOString()
    }
  } catch {
    throw createError({ statusCode: 400, statusMessage: '创建失败，请重试' })
  }
})
