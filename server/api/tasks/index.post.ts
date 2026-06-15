import { prisma } from '../../utils/prisma'
import { parseTaskPayload } from '../../utils/tasks'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const data = parseTaskPayload(body)

  return prisma.task.create({
    data: {
      title: data.title!,
      tag: data.tag!,
      status: data.status!,
      priority: data.priority!,
      dueTime: data.dueTime,
      startTime: data.startTime,
      reminderHours: data.reminderHours
    }
  })
})
