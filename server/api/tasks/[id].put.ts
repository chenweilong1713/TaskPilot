import { prisma } from '../../utils/prisma'
import { parseTaskPayload } from '../../utils/tasks'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '缺少任务 ID' })
  }

  const body = await readBody(event)
  const data = parseTaskPayload(body, true)

  try {
    return await prisma.task.update({
      where: { id },
      data
    })
  } catch {
    throw createError({ statusCode: 404, statusMessage: '任务不存在' })
  }
})
