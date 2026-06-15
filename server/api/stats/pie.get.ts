import { prisma } from '../../utils/prisma'
import { statusLabels } from '~/utils/taskLabels'
import type { TaskStatus } from '~/types/task'
import { getDateRangeFromQuery } from '../../utils/stats'

export default defineEventHandler(async (event) => {
  const grouped = await prisma.task.groupBy({
    by: ['status'],
    where: getDateRangeFromQuery(getQuery(event)),
    _count: {
      status: true
    }
  })

  const counts = new Map<TaskStatus, number>(
    grouped.map((item) => [item.status as TaskStatus, item._count.status])
  )

  return (['todo', 'doing', 'done'] as TaskStatus[]).map((status) => ({
    status,
    label: statusLabels[status],
    value: counts.get(status) ?? 0
  }))
})
