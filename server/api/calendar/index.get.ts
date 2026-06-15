import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const year = Number(query.year) || new Date().getFullYear()
  const month = Number(query.month) || new Date().getMonth() + 1

  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

  // Fetch tasks that have any overlap with this month:
  // (startTime <= monthEnd AND dueTime >= monthStart) OR (no startTime AND dueTime in month)
  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        // Tasks with both start and due that overlap the month
        {
          startTime: { lte: monthEnd },
          dueTime: { gte: monthStart }
        },
        // Tasks without startTime but dueDate in this month
        {
          startTime: null,
          dueTime: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      ]
    },
    orderBy: { dueTime: 'asc' }
  })

  const list = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    tag: t.tag,
    status: t.status,
    priority: t.priority,
    startTime: t.startTime?.toISOString() ?? null,
    dueTime: t.dueTime?.toISOString() ?? null,
    reminderHours: t.reminderHours,
    reminded: t.reminded
  }))

  return { year, month, tasks: list }
})
