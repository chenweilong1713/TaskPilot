import type { TaskPriority, TaskStatus } from '~/types/task'

export const taskStatuses = ['todo', 'doing', 'done'] as const
export const taskPriorities = ['low', 'medium', 'high'] as const

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && taskStatuses.includes(value as TaskStatus)
}

export function isTaskPriority(value: unknown): value is TaskPriority {
  return typeof value === 'string' && taskPriorities.includes(value as TaskPriority)
}

export function parseTaskPayload(body: unknown, partial = false) {
  const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  const data: {
    title?: string
    tag?: string
    status?: TaskStatus
    priority?: TaskPriority
    dueTime?: Date | null
    startTime?: Date | null
    reminderHours?: number | null
  } = {}

  if (!partial || payload.title !== undefined) {
    if (typeof payload.title !== 'string' || payload.title.trim().length === 0) {
      throw createError({ statusCode: 400, statusMessage: '任务名称不能为空' })
    }
    data.title = payload.title.trim()
  }

  if (!partial || payload.tag !== undefined) {
    if (typeof payload.tag !== 'string' || payload.tag.trim().length === 0) {
      throw createError({ statusCode: 400, statusMessage: '标签不能为空' })
    }
    data.tag = payload.tag.trim().slice(0, 20)
  }

  if (!partial || payload.status !== undefined) {
    if (!isTaskStatus(payload.status)) {
      throw createError({ statusCode: 400, statusMessage: '任务状态无效' })
    }
    data.status = payload.status
  }

  if (!partial || payload.priority !== undefined) {
    if (!isTaskPriority(payload.priority)) {
      throw createError({ statusCode: 400, statusMessage: '任务优先级无效' })
    }
    data.priority = payload.priority
  }

  if (payload.dueTime !== undefined) {
    if (payload.dueTime === null || payload.dueTime === '') {
      data.dueTime = null
    } else if (typeof payload.dueTime === 'string') {
      const parsedDate = new Date(payload.dueTime)
      if (Number.isNaN(parsedDate.getTime())) {
        throw createError({ statusCode: 400, statusMessage: '截止时间无效' })
      }
      data.dueTime = parsedDate
    } else {
      throw createError({ statusCode: 400, statusMessage: '截止时间无效' })
    }
  }

  if (payload.startTime !== undefined) {
    if (payload.startTime === null || payload.startTime === '') {
      data.startTime = null
    } else if (typeof payload.startTime === 'string') {
      const parsed = new Date(payload.startTime)
      if (Number.isNaN(parsed.getTime())) {
        throw createError({ statusCode: 400, statusMessage: '开始时间无效' })
      }
      data.startTime = parsed
    }
  }

  if (payload.reminderHours !== undefined) {
    if (payload.reminderHours === null || payload.reminderHours === '') {
      data.reminderHours = null
    } else {
      const hours = Number(payload.reminderHours)
      if (Number.isNaN(hours) || hours <= 0) {
        throw createError({ statusCode: 400, statusMessage: '提醒时间无效' })
      }
      data.reminderHours = hours
    }
  }

  return data
}
