import { prisma } from '../../utils/prisma'
import { parseDateQuery } from '../../utils/stats'

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const days = query.days === '30' ? 30 : 7
  const customStart = parseDateQuery(query.start)
  const customEnd = parseDateQuery(query.end)
  const start = customStart ?? new Date()
  start.setHours(0, 0, 0, 0)

  if (!customStart) {
    start.setDate(start.getDate() - (days - 1))
  }

  const end = customEnd ?? new Date(start)
  if (!customEnd) {
    end.setDate(start.getDate() + (days - 1))
    end.setHours(23, 59, 59, 999)
  }

  const tasks = await prisma.task.findMany({
    where: {
      status: 'done',
      dueTime: {
        gte: start,
        lte: end
      }
    },
    select: {
      dueTime: true
    }
  })

  const bucket = new Map<string, number>()
  const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1)
  for (let index = 0; index < totalDays; index += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    bucket.set(formatDate(date), 0)
  }

  for (const task of tasks) {
    if (!task.dueTime) continue
    const key = formatDate(task.dueTime)
    bucket.set(key, (bucket.get(key) ?? 0) + 1)
  }

  return [...bucket.entries()].map(([date, completed]) => ({ date, completed }))
})
