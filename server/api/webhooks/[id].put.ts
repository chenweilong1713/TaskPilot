import { getAuthenticatedUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { user } = await getAuthenticatedUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '缺少 Webhook ID' })
  }

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
    const webhook = await prisma.webhook.updateMany({
      where: { id, userId: user.id },
      data: { title, url }
    })

    if (webhook.count === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Webhook 不存在' })
    }

    return { ok: true }
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode) throw error
    throw createError({ statusCode: 400, statusMessage: '更新失败，请重试' })
  }
})
