import { defineStore } from 'pinia'
import type { Task, TaskInput, TaskPageResponse, TaskPriority, TaskStatus, TaskTagDistribution } from '~/types/task'

export type TaskDueFilter = 'all' | 'today' | 'week'

export const useTasksStore = defineStore('tasks', () => {
  const api = useApi()
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const statusFilter = ref<TaskStatus | 'all'>('todo')
  const prioritySort = ref<'desc' | 'asc'>('desc')
  const searchKeyword = ref('')
  const tagFilter = ref('')
  const priorityFilter = ref<TaskPriority | 'all'>('all')
  const dueFilter = ref<TaskDueFilter>('all')
  const dueStart = ref('')
  const dueEnd = ref('')
  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const totalPages = ref(1)
  const availableTags = ref<string[]>([])
  const tagDistribution = ref<TaskTagDistribution[]>([])
  const summary = ref({
    total: 0,
    completed: 0,
    doing: 0,
    todo: 0,
    overdue: 0,
    completionRate: 0
  })

  const canGoPrev = computed(() => page.value > 1)
  const canGoNext = computed(() => page.value < totalPages.value)

  function applyFilters(filters: {
    keyword?: string
    tag?: string
    priority?: TaskPriority | 'all'
    due?: TaskDueFilter
    dueStart?: string
    dueEnd?: string
  }) {
    searchKeyword.value = filters.keyword?.trim() ?? ''
    tagFilter.value = filters.tag ?? ''
    priorityFilter.value = filters.priority ?? 'all'
    dueFilter.value = filters.due ?? 'all'
    dueStart.value = filters.dueStart ?? ''
    dueEnd.value = filters.dueEnd ?? ''
    page.value = 1
    return fetchTasks()
  }

  function resetFilters() {
    searchKeyword.value = ''
    tagFilter.value = ''
    priorityFilter.value = 'all'
    dueFilter.value = 'all'
    dueStart.value = ''
    dueEnd.value = ''
    page.value = 1
    return fetchTasks()
  }

  async function setStatusFilter(status: TaskStatus | 'all') {
    statusFilter.value = status
    page.value = 1
    await fetchTasks()
  }

  async function setPrioritySort(sort: 'desc' | 'asc') {
    prioritySort.value = sort
    page.value = 1
    await fetchTasks()
  }

  async function goToPage(nextPage: number) {
    page.value = Math.min(Math.max(1, nextPage), totalPages.value)
    await fetchTasks()
  }

  async function fetchTasks(options?: { page?: number }) {
    if (options?.page) {
      page.value = options.page
    }

    loading.value = true
    try {
      const params = new URLSearchParams({
        page: String(page.value),
        pageSize: String(pageSize.value),
        sort: prioritySort.value
      })
      if (statusFilter.value !== 'all') params.set('status', statusFilter.value)
      if (priorityFilter.value !== 'all') params.set('priority', priorityFilter.value)
      if (tagFilter.value) params.set('tag', tagFilter.value)
      if (searchKeyword.value) params.set('keyword', searchKeyword.value)
      if (dueFilter.value !== 'all') params.set('due', dueFilter.value)
      if (dueStart.value) params.set('dueStart', dueStart.value)
      if (dueEnd.value) params.set('dueEnd', dueEnd.value)

      const response = await api<TaskPageResponse>(`/api/tasks?${params.toString()}`)
      tasks.value = response.items
      total.value = response.total
      page.value = response.page
      pageSize.value = response.pageSize
      totalPages.value = response.totalPages
      availableTags.value = response.availableTags
      tagDistribution.value = response.tagDistribution
      summary.value = response.summary
    } finally {
      loading.value = false
    }
  }

  async function createTask(payload: TaskInput) {
    const task = await api<Task>('/api/tasks', {
      method: 'POST',
      body: payload
    })
    await fetchTasks({ page: 1 })
    return task
  }

  async function updateTask(id: string, payload: Partial<TaskInput>) {
    const updatedTask = await api<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: payload
    })
    await fetchTasks()
    return updatedTask
  }

  async function deleteTask(id: string) {
    await api(`/api/tasks/${id}`, { method: 'DELETE' })
    await fetchTasks()
  }

  async function advanceStatus(task: Task) {
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      todo: 'doing',
      doing: 'done',
      done: 'todo'
    }

    return updateTask(task.id, { status: nextStatus[task.status] })
  }

  async function completeTask(task: Task) {
    if (task.status === 'done') return task
    return updateTask(task.id, { status: 'done' })
  }

  return {
    tasks,
    loading,
    statusFilter,
    prioritySort,
    searchKeyword,
    tagFilter,
    priorityFilter,
    dueFilter,
    dueStart,
    dueEnd,
    page,
    pageSize,
    total,
    totalPages,
    canGoPrev,
    canGoNext,
    summary,
    availableTags,
    tagDistribution,
    applyFilters,
    resetFilters,
    setStatusFilter,
    setPrioritySort,
    goToPage,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    advanceStatus,
    completeTask
  }
})
