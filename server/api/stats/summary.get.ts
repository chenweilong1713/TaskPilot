import { prisma } from '../../utils/prisma'
import { getDateRangeFromQuery } from '../../utils/stats'

export default defineEventHandler(async (event) => {
  const dateWhere = getDateRangeFromQuery(getQuery(event))
  const [total, completed, doing] = await Promise.all([
    prisma.task.count({ where: dateWhere }),
    prisma.task.count({ where: { ...dateWhere, status: 'done' } }),
    prisma.task.count({ where: { ...dateWhere, status: 'doing' } })
  ])

  return {
    total,
    completed,
    uncompleted: total - completed,
    doing,
    completionRate: total === 0 ? 0 : Math.round((completed / total) * 100)
  }
})
