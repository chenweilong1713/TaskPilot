export type TaskStatus = 'todo' | 'doing' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  tag: string
  status: TaskStatus
  priority: TaskPriority
  createdAt: string
  dueTime: string | null
  startTime: string | null
  reminderHours: number | null
  reminded: boolean
}

export interface TaskInput {
  title: string
  tag: string
  status: TaskStatus
  priority: TaskPriority
  dueTime?: string | null
  startTime?: string | null
  reminderHours?: number | null
}

export interface TaskTagDistribution {
  label: string
  count: number
  percent: number
}

export interface TaskPageResponse {
  items: Task[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  availableTags: string[]
  tagDistribution: TaskTagDistribution[]
  summary: {
    total: number
    completed: number
    doing: number
    todo: number
    overdue: number
    completionRate: number
  }
}

export interface StatsSummary {
  total: number
  completed: number
  uncompleted: number
  doing: number
  completionRate: number
}

export interface TrendPoint {
  date: string
  completed: number
}

export interface PiePoint {
  status: TaskStatus
  label: string
  value: number
}
