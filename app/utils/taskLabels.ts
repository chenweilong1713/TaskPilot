import type { TaskPriority, TaskStatus } from '~/types/task'

export const statusLabels: Record<TaskStatus, string> = {
  todo: '待办',
  doing: '进行中',
  done: '已完成'
}

export const priorityLabels: Record<TaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高'
}

export const priorityRank: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1
}
