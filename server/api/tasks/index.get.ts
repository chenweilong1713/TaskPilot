import { prisma } from '../../utils/prisma'
import { isTaskPriority, isTaskStatus } from '../../utils/tasks'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const status = isTaskStatus(query.status) ? query.status : undefined
  const priority = isTaskPriority(query.priority) ? query.priority : undefined
  const keyword = typeof query.keyword === 'string' ? query.keyword.trim() : ''
  const tag = typeof query.tag === 'string' ? query.tag.trim() : ''
  const due = query.due === 'today' || query.due === 'week' ? query.due : 'all'
  const dueStart = parseDateQuery(query.dueStart)
  const dueEnd = parseDateQuery(query.dueEnd)
  const page = clampNumber(query.page, 1, 1, 9999)
  const pageSize = clampNumber(query.pageSize, 10, 1, 50)
  const prioritySort = query.sort === 'asc' ? 'asc' : 'desc'
  const priorityRank = prioritySort === 'desc'
    ? { high: 1, medium: 2, low: 3 }
    : { low: 1, medium: 2, high: 3 }

  const where = {
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(tag ? { tag } : {}),
    ...(keyword ? { title: { contains: keyword } } : {}),
    ...(due !== 'all' || dueStart || dueEnd ? { dueTime: getDueRange(due, dueStart, dueEnd) } : {})
  }

  const [matchedTasks, allTasks] = await Promise.all([
    prisma.task.findMany({ where }),
    prisma.task.findMany()
  ])

  const sortedTasks = matchedTasks.sort((a, b) => {
    const priorityScore = priorityRank[a.priority as keyof typeof priorityRank] - priorityRank[b.priority as keyof typeof priorityRank]
    if (priorityScore !== 0) return priorityScore
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  const total = sortedTasks.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const items = sortedTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const availableTags = [...new Set(allTasks.map((task) => task.tag).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))

  const tagCounts = matchedTasks.reduce<Record<string, number>>((result, task) => {
    result[task.tag] = (result[task.tag] ?? 0) + 1
    return result
  }, {})
  const tagDistribution = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label,
      count,
      percent: matchedTasks.length === 0 ? 0 : Math.round((count / matchedTasks.length) * 100)
    }))

  const now = Date.now()
  const completed = matchedTasks.filter((task) => task.status === 'done').length
  const doing = matchedTasks.filter((task) => task.status === 'doing').length
  const todo = matchedTasks.filter((task) => task.status === 'todo').length
  const overdue = matchedTasks.filter((task) => task.status !== 'done' && task.dueTime && task.dueTime.getTime() < now).length

  return {
    items,
    total,
    page: currentPage,
    pageSize,
    totalPages,
    availableTags,
    tagDistribution,
    summary: {
      total: matchedTasks.length,
      completed,
      doing,
      todo,
      overdue,
      completionRate: matchedTasks.length === 0 ? 0 : Math.round((completed / matchedTasks.length) * 100)
    }
  }
})

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

function getDueRange(due: 'all' | 'today' | 'week', customStart: Date | null, customEnd: Date | null) {
  if (customStart || customEnd) {
    return {
      ...(customStart ? { gte: customStart } : {}),
      ...(customEnd ? { lte: customEnd } : {})
    }
  }

  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  if (due === 'today') {
    end.setDate(start.getDate() + 1)
  } else {
    const day = start.getDay() || 7
    start.setDate(start.getDate() - day + 1)
    end.setTime(start.getTime())
    end.setDate(start.getDate() + 7)
  }

  return {
    gte: start,
    lt: end
  }
}

function parseDateQuery(value: unknown) {
  if (typeof value !== 'string' || !value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
