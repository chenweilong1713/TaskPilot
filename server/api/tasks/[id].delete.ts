import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '缺少任务 ID' })
  }

  try {
    await prisma.task.delete({ where: { id } })
    return { ok: true }
  } catch {
    throw createError({ statusCode: 404, statusMessage: '任务不存在' })
  }
})
