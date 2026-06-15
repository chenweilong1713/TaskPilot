<template>
  <AppShell>
    <div class="mb-4 flex justify-end">
      <div class="flex flex-wrap items-center justify-end gap-3">
        <button class="btn-secondary px-4" type="button" @click="filtersOpen = !filtersOpen">
          <SlidersHorizontal :size="16" />
          过滤
        </button>
        <button class="btn-primary" type="button" @click="openCreate">
          <Plus :size="16" />
          新增任务
        </button>
      </div>
    </div>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section class="min-w-0">
        <div class="mb-4 flex flex-col gap-3 rounded-[16px] bg-white p-3 shadow-[0_14px_34px_rgba(154,84,45,0.05)] sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-wrap gap-5">
            <button
              v-for="filter in filters"
              :key="filter.value"
              :class="store.statusFilter === filter.value ? 'text-[#c65a3f] after:bg-[#e76f51]' : 'text-stone-500 after:bg-transparent'"
              class="relative pb-1.5 text-xs font-bold transition after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full"
              type="button"
              @click="store.setStatusFilter(filter.value)"
            >
              {{ filter.label }}
            </button>
          </div>
          <label class="flex items-center gap-2 text-xs text-stone-500">
            优先级
            <select :value="store.prioritySort" class="input-field w-28" @change="handlePrioritySortChange">
              <option value="desc">高到低</option>
              <option value="asc">低到高</option>
            </select>
          </label>
        </div>

        <form v-if="filtersOpen" class="soft-card mb-4 space-y-3 p-4" @submit.prevent="applySearch">
          <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_150px]">
            <label class="block">
              <span class="text-xs font-bold text-stone-600">任务名称</span>
              <input v-model="filterForm.keyword" class="input-field mt-2" placeholder="输入关键词">
            </label>
            <label class="block">
              <span class="text-xs font-bold text-stone-600">标签</span>
              <select v-model="filterForm.tag" class="input-field mt-2">
                <option value="">全部标签</option>
                <option v-for="tag in allTagOptions" :key="tag" :value="tag">{{ tag }}</option>
              </select>
            </label>
            <label class="block">
              <span class="text-xs font-bold text-stone-600">优先级</span>
              <select v-model="filterForm.priority" class="input-field mt-2">
                <option value="all">全部</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </label>
          </div>

          <div class="grid gap-3 border-t border-orange-100/70 pt-3 sm:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <label class="block">
              <span class="text-xs font-bold text-stone-600">截止日期</span>
              <select v-model="filterForm.due" class="input-field mt-2" @change="handleDuePresetChange">
                <option value="all">全部</option>
                <option value="today">本日</option>
                <option value="week">本周</option>
              </select>
            </label>
            <label class="block">
              <span class="text-xs font-bold text-stone-600">开始时间</span>
              <input v-model="filterForm.dueStart" class="input-field mt-2" type="datetime-local" @input="filterForm.due = 'all'">
            </label>
            <label class="block">
              <span class="text-xs font-bold text-stone-600">结束时间</span>
              <input v-model="filterForm.dueEnd" class="input-field mt-2" type="datetime-local" @input="filterForm.due = 'all'">
            </label>
            <div class="flex gap-2">
              <button class="btn-primary flex-1 sm:flex-none" type="submit">查询</button>
              <button class="btn-secondary flex-1 sm:flex-none" type="button" @click="resetSearch">重置</button>
            </div>
          </div>
        </form>

        <div class="soft-card overflow-hidden">
          <div class="grid grid-cols-[40px_minmax(200px,1fr)_100px_110px_90px_80px_100px_100px_180px] gap-3 border-b border-orange-100/70 px-4 py-3 text-xs font-bold text-stone-400">
            <span />
            <span>任务</span>
            <span>标签</span>
            <span>优先级</span>
            <span>提醒</span>
            <span>开始时间</span>
            <span>截止时间</span>
            <span>状态</span>
            <span>操作</span>
          </div>
          <div v-if="store.loading" class="p-8 text-center text-xs text-stone-500">任务加载中...</div>
          <div v-else-if="store.tasks.length === 0" class="p-10 text-center">
            <p class="text-sm font-bold text-stone-900">暂无任务</p>
            <p class="mt-2 text-xs text-stone-500">新增任务后，这里会显示真实数据库中的任务。</p>
          </div>
          <div
            v-for="task in store.tasks"
            v-else
            :key="task.id"
            class="grid w-full cursor-pointer grid-cols-[40px_minmax(200px,1fr)_100px_110px_90px_80px_100px_100px_180px] items-center gap-3 border-b border-orange-50 px-4 py-3 text-left transition last:border-b-0 hover:bg-orange-50/50"
            role="button"
            tabindex="0"
            @click="openEdit(task)"
            @keydown.enter="openEdit(task)"
          >
            <span
              class="grid h-6 w-6 place-items-center rounded-full border"
              :class="task.status === 'done' ? 'border-[#8ab17d] bg-[#8ab17d] text-white' : 'border-stone-300 text-transparent'"
            >
              <Check :size="14" />
            </span>
            <span class="truncate text-xs font-bold text-stone-700">{{ task.title }}</span>
            <span>
              <span class="inline-block max-w-full truncate rounded-lg bg-[#fff1e6] px-3 py-1 text-xs font-bold text-[#c65a3f]">{{ task.tag }}</span>
            </span>
            <span class="text-xs font-bold" :class="priorityTextClass(task.priority)">{{ priorityLabels[task.priority] }}</span>
            <span class="text-xs text-[#e76f51]">
              <template v-if="task.reminderHours">⏰ {{ formatReminder(task.reminderHours) }}<span v-if="task.reminded" class="ml-1 text-[10px] text-[#6f8f61]">✓</span></template>
              <template v-else>-</template>
            </span>
            <span class="text-xs text-stone-400">{{ task.startTime ? formatDueTime(task.startTime) : '-' }}</span>
            <span class="text-xs text-stone-500">{{ task.dueTime ? formatDueTime(task.dueTime) : '未设置' }}</span>
            <span>
              <span class="rounded-lg px-3 py-1 text-xs font-bold" :class="isOverdue(task) ? 'bg-[#dc3545] text-white shadow-[0_4px_12px_rgba(220,53,69,0.3)]' : statusPillClass(task.status)">
                {{ isOverdue(task) ? '已过期' : statusLabels[task.status] }}
              </span>
            </span>
            <span class="flex items-center gap-2" @click.stop>
              <button
                v-if="task.status !== 'done'"
                class="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-xs font-bold transition"
                :class="task.status === 'todo' ? 'bg-[#f4a261] text-white shadow-[0_10px_18px_rgba(244,162,97,0.2)] hover:bg-[#e0914e]' : 'bg-[#e76f51] text-white shadow-[0_10px_18px_rgba(231,111,81,0.22)] hover:bg-[#d85f43]'"
                type="button"
                @click="handlePrimaryAction(task)"
              >
                <component :is="task.status === 'todo' ? RefreshCw : CheckCircle2" :size="13" />
                {{ task.status === 'todo' ? '进行中' : '完成' }}
              </button>
              <span v-else class="inline-flex h-7 items-center gap-1 rounded-lg bg-[#eef4e9] px-2.5 text-xs font-bold text-[#6f8f61]">
                <CheckCircle2 :size="13" />
                已完成
              </span>
<!--              <button class="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-stone-400 hover:bg-white hover:text-[#c65a3f]" type="button" @click="store.advanceStatus(task)">-->
<!--                <RefreshCw :size="13" />-->
<!--              </button>-->
              <button class="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-stone-400 hover:bg-white hover:text-[#b56576]" type="button" @click="handleDelete(task)">
                <Trash2 :size="13" />
              </button>
            </span>
          </div>

          <div v-if="store.total > 0" class="flex flex-wrap items-center justify-between gap-3 border-t border-orange-100/70 px-4 py-3 text-xs text-stone-500">
            <span>共 {{ store.total }} 条，第 {{ store.page }} / {{ store.totalPages }} 页</span>
            <div class="flex items-center gap-2">
              <button class="btn-secondary px-3" :disabled="!store.canGoPrev || store.loading" type="button" @click="store.goToPage(store.page - 1)">上一页</button>
              <button class="btn-secondary px-3" :disabled="!store.canGoNext || store.loading" type="button" @click="store.goToPage(store.page + 1)">下一页</button>
            </div>
          </div>
        </div>
      </section>

      <aside class="space-y-6">
        <div class="soft-card p-4">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-sm font-extrabold text-stone-950">任务统计</h2>
            <span class="rounded-[10px] border border-orange-100 px-3 py-1 text-xs font-bold text-stone-500">本周</span>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between text-xs">
              <span class="font-semibold text-stone-700">全部任务</span>
              <span class="font-extrabold text-stone-950">{{ store.summary.total }}</span>
            </div>
            <div v-for="row in statRows" :key="row.label" class="flex items-center justify-between text-xs">
              <span class="flex items-center gap-2 text-stone-600">
                <span class="h-2.5 w-2.5 rounded-full" :class="row.dot" />
                {{ row.label }}
              </span>
              <span class="font-bold text-stone-900">{{ row.value }}</span>
            </div>
          </div>
        </div>

        <div class="soft-card p-4">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-sm font-extrabold text-stone-950">标签分布</h2>
            <ChevronRight :size="17" class="text-stone-400" />
          </div>
          <div v-if="tagRows.length" class="flex items-center gap-4">
            <div class="grid h-24 w-24 place-items-center rounded-full" :style="{ background: tagChartGradient }">
              <div class="h-14 w-14 rounded-full bg-white" />
            </div>
            <div class="flex-1 space-y-3 text-xs">
              <div v-for="tag in tagRows" :key="tag.label" class="flex items-center justify-between gap-3">
                <span class="flex items-center gap-2 text-stone-500">
                  <span class="h-2.5 w-2.5 rounded-full" :class="tag.dot" />
                  {{ tag.label }}
                </span>
                <span class="font-bold text-stone-700">{{ tag.count }} ({{ tag.percent }}%)</span>
              </div>
            </div>
          </div>
          <p v-else class="text-xs text-stone-500">暂无标签数据</p>
        </div>
      </aside>

      <aside class="hidden">
        <div class="space-y-2">
          <button
            v-for="filter in filters"
            :key="filter.value"
            :class="store.statusFilter === filter.value ? 'bg-orange-50 text-[#c65a3f]' : 'text-stone-600 hover:bg-orange-50'"
            class="w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition"
            type="button"
            @click="store.setStatusFilter(filter.value)"
          >
            {{ filter.label }}
          </button>
        </div>
      </aside>
    </div>

    <div v-if="drawerOpen" class="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" @click="closeDrawer" />
    <aside
      class="fixed inset-y-0 right-0 z-50 w-full max-w-md transform bg-white p-5 shadow-2xl transition"
      :class="drawerOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold text-stone-900">{{ selectedTask ? '编辑任务' : '创建任务' }}</h2>
        <button class="btn-secondary px-3" type="button" @click="closeDrawer">关闭</button>
      </div>

      <form class="mt-6 space-y-4" @submit.prevent="submitTask">
        <label class="block">
          <span class="text-sm font-medium text-stone-700">任务名称</span>
          <input v-model="form.title" class="input-field mt-2" required>
        </label>
        <label class="block">
          <span class="text-sm font-medium text-stone-700">标签</span>
          <input v-model="form.tag" class="input-field mt-2" maxlength="20" required placeholder="输入标签，或点击下方快捷标签">
        </label>
        <div>
          <p class="text-xs font-bold text-stone-500">快捷标签</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="tag in allTagOptions"
              :key="tag"
              class="rounded-lg border px-3 py-1 text-xs font-bold transition"
              :class="form.tag === tag ? 'border-[#e76f51] bg-[#fff1e6] text-[#c65a3f]' : 'border-orange-100 bg-white text-stone-500 hover:border-orange-200 hover:text-[#c65a3f]'"
              type="button"
              @click="form.tag = tag"
            >
              {{ tag }}
            </button>
          </div>
        </div>
        <label class="block">
          <span class="text-sm font-medium text-stone-700">状态</span>
          <select v-model="form.status" class="input-field mt-2">
            <option value="todo">待办</option>
            <option value="doing">进行中</option>
            <option value="done">已完成</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-medium text-stone-700">优先级</span>
          <select v-model="form.priority" class="input-field mt-2">
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-medium text-stone-700">开始时间</span>
          <input v-model="form.startTime" class="input-field mt-2" type="datetime-local">
        </label>
        <label class="block">
          <span class="text-sm font-medium text-stone-700">截止时间</span>
          <input v-model="form.dueTime" class="input-field mt-2" type="datetime-local">
        </label>
        <label class="block">
          <span class="text-sm font-medium text-stone-700">提醒时间 <span class="font-normal text-stone-400">(小时)</span></span>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="preset in reminderPresets"
              :key="preset.value"
              class="btn-secondary !px-2.5 !py-1 text-[11px]"
              :class="form.reminderHours === preset.value ? '!border-[#e76f51] !text-[#c65a3f]' : ''"
              type="button"
              @click="form.reminderHours = preset.value"
            >
              {{ preset.label }}
            </button>
          </div>
          <input
            v-model.number="form.reminderHours"
            class="input-field mt-2"
            placeholder="自定义小时数，留空表示不提醒"
            type="number"
            min="0.5"
            step="0.5"
          >
        </label>
        <button class="btn-primary w-full" :disabled="submitting" type="submit">
          {{ submitting ? '保存中...' : '保存任务' }}
        </button>
      </form>
    </aside>
  </AppShell>

    <!-- 删除确认弹窗 -->
    <ConfirmDialog
      :visible="deleteTarget !== null"
      title="确认删除"
      :message="deleteTarget ? `确认删除任务「${deleteTarget.title}」？删除后无法恢复。` : ''"
      confirm-text="删除"
      cancel-text="取消"
      danger
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    />
</template>

<script setup lang="ts">
import { Check, CheckCircle2, ChevronRight, Plus, RefreshCw, SlidersHorizontal, Trash2 } from '@lucide/vue'
import type { Task, TaskInput, TaskPriority, TaskStatus } from '~/types/task'
import { priorityLabels, statusLabels } from '~/utils/taskLabels'

const store = useTasksStore()
const toast = useToastStore()
const reminderPresets = [
  { label: '1 天', value: 24 },
  { label: '6 小时', value: 6 },
  { label: '3 小时', value: 3 },
  { label: '1 小时', value: 1 },
  { label: '30 分钟', value: 0.5 }
]

const defaultTags = ['工作', '学习', '生活', '重要', '其他']
const tagColors = ['#e76f51', '#8ab17d', '#b56576', '#f4a261', '#d8c3a5', '#6f8f61']

const filters: { label: string, value: TaskStatus | 'all' }[] = [
  { label: '待办', value: 'todo' },
  { label: '进行中', value: 'doing' },
  { label: '已完成', value: 'done' },
  { label: '全部', value: 'all' }
]

const drawerOpen = ref(false)
const selectedTask = ref<Task | null>(null)
const submitting = ref(false)
const filtersOpen = ref(false)
const filterForm = reactive<{
  keyword: string
  tag: string
  priority: TaskPriority | 'all'
  due: 'all' | 'today' | 'week'
  dueStart: string
  dueEnd: string
}>({
  keyword: '',
  tag: '',
  priority: 'all',
  due: 'all',
  dueStart: '',
  dueEnd: ''
})
const form = reactive<TaskInput>({
  title: '',
  tag: defaultTags[0],
  status: 'todo',
  priority: 'medium',
  dueTime: null,
  startTime: null,
  reminderHours: 6
})

await callOnce('tasks', () => store.fetchTasks())

const statRows = computed(() => [
  { label: '已完成', value: store.summary.completed, dot: 'bg-[#8ab17d]' },
  { label: '进行中', value: store.summary.doing, dot: 'bg-[#f4a261]' },
  { label: '待开始', value: store.summary.todo, dot: 'bg-[#e76f51]' },
  { label: '已逾期', value: store.summary.overdue, dot: 'bg-stone-300' }
])

const allTagOptions = computed(() => [...new Set([...defaultTags, ...store.availableTags])])
const tagRows = computed(() => store.tagDistribution.map((tag, index) => ({
  ...tag,
  dot: tagDotClass(index),
  color: tagColors[index % tagColors.length]
})))

const tagChartGradient = computed(() => {
  if (!tagRows.value.length) return '#f5f5f4'

  let cursor = 0
  const segments = tagRows.value.map((tag) => {
    const start = cursor
    cursor += tag.percent
    return `${tag.color} ${start}% ${cursor}%`
  })

  return `conic-gradient(${segments.join(',')})`
})

function resetForm() {
  form.title = ''
  form.tag = defaultTags[0]
  form.status = 'todo'
  form.priority = 'medium'
  form.startTime = toDateTimeLocal(new Date().toISOString())
  form.dueTime = toDateTimeLocal(new Date().toISOString())
  form.reminderHours = 6
}

function handlePrioritySortChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value === 'asc' ? 'asc' : 'desc'
  store.setPrioritySort(value)
}

function handleDuePresetChange() {
  if (filterForm.due === 'all') {
    filterForm.dueStart = ''
    filterForm.dueEnd = ''
    return
  }

  const { start, end } = getDuePresetRange(filterForm.due)
  filterForm.dueStart = toDateTimeLocal(start.toISOString()) ?? ''
  filterForm.dueEnd = toDateTimeLocal(end.toISOString()) ?? ''
}

function toDateTimeLocal(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

function getDuePresetRange(due: 'today' | 'week') {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  if (due === 'week') {
    const day = start.getDay() || 7
    start.setDate(start.getDate() - day + 1)
  }

  const end = new Date(start)
  end.setDate(start.getDate() + (due === 'today' ? 1 : 7))

  return { start, end }
}

function openCreate() {
  selectedTask.value = null
  resetForm()
  drawerOpen.value = true
}

function openEdit(task: Task) {
  selectedTask.value = task
  form.title = task.title
  form.tag = task.tag
  form.status = task.status
  form.priority = task.priority as TaskPriority
  form.startTime = toDateTimeLocal(task.startTime)
  form.dueTime = toDateTimeLocal(task.dueTime)
  form.reminderHours = task.reminderHours
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
}

async function submitTask() {
  form.tag = form.tag.trim()
  if (!form.tag) {
    toast.error('标签不能为空')
    return
  }

  submitting.value = true
  try {
    const payload = {
      ...form,
      startTime: form.startTime ? new Date(form.startTime).toISOString() : null,
      dueTime: form.dueTime ? new Date(form.dueTime).toISOString() : null,
      reminderHours: form.reminderHours ?? null
    }
    if (selectedTask.value) {
      await store.updateTask(selectedTask.value.id, payload)
      toast.success('任务已保存')
    } else {
      await store.createTask(payload)
      toast.success('任务已添加')
    }
    closeDrawer()
  } catch {
    // Error toast is handled globally by useApi.
  } finally {
    submitting.value = false
  }
}

function applySearch() {
  store.applyFilters({
    keyword: filterForm.keyword,
    tag: filterForm.tag,
    priority: filterForm.priority,
    due: filterForm.due,
    dueStart: filterForm.dueStart ? new Date(filterForm.dueStart).toISOString() : '',
    dueEnd: filterForm.dueEnd ? new Date(filterForm.dueEnd).toISOString() : ''
  })
}

function resetSearch() {
  filterForm.keyword = ''
  filterForm.tag = ''
  filterForm.priority = 'all'
  filterForm.due = 'all'
  filterForm.dueStart = ''
  filterForm.dueEnd = ''
  store.resetFilters()
}

const deleteTarget = ref<Task | null>(null)

async function handleDelete(task: Task) {
  deleteTarget.value = task
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  const task = deleteTarget.value
  deleteTarget.value = null
  await store.deleteTask(task.id)
}

async function handlePrimaryAction(task: Task) {
  if (task.status === 'todo') {
    await store.updateTask(task.id, { status: 'doing' })
    toast.success('任务已进入进行中')
    return
  }

  if (task.status === 'doing') {
    await store.completeTask(task)
    toast.success('任务已完成')
  }
}

function formatReminder(hours: number) {
  if (hours >= 24) {
    const days = hours / 24
    return Number.isInteger(days) ? `${days}天` : `${days}天`
  }
  if (hours >= 1) {
    return Number.isInteger(hours) ? `${hours}小时` : `${hours}小时`
  }
  return `${hours * 60}分钟`
}

function formatDate(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function formatDueTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function priorityTextClass(priority: TaskPriority) {
  return {
    low: 'text-[#6f8f61]',
    medium: 'text-[#d9902f]',
    high: 'text-[#b56576]'
  }[priority]
}

function isOverdue(task: Task) {
  return task.status !== 'done' && task.dueTime && new Date(task.dueTime).getTime() < Date.now()
}

function statusPillClass(status: TaskStatus) {
  return {
    todo: 'bg-stone-50 text-stone-500',
    doing: 'bg-[#fff4d8] text-[#d9902f]',
    done: 'bg-[#eef4e9] text-[#6f8f61]'
  }[status]
}

function priorityPillClass(priority: TaskPriority) {
  return {
    low: 'bg-[#eef4e9] text-[#6f8f61]',
    medium: 'bg-[#fff4d8] text-[#d9902f]',
    high: 'bg-[#f8e8e6] text-[#b56576]'
  }[priority]
}

function tagDotClass(index: number) {
  return [
    'bg-[#e76f51]',
    'bg-[#8ab17d]',
    'bg-[#b56576]',
    'bg-[#f4a261]',
    'bg-[#d8c3a5]',
    'bg-[#6f8f61]'
  ][index % tagColors.length]
}
</script>
