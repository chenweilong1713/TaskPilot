import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 1)

  const tasks = await prisma.task.findMany({
    where: {
      dueTime: {
        gte: start,
        lt: end
      }
    },
    orderBy: { dueTime: 'asc' }
  })

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    tag: t.tag,
    status: t.status,
    priority: t.priority,
    dueTime: t.dueTime?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    reminderHours: t.reminderHours
  }))
})
