<template>
  <AppShell>
    <!-- Header -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <select v-model.number="year" class="input-field w-20 !py-1.5 text-xs" @change="fetchCalendar">
          <option v-for="y in yearRange" :key="y" :value="y">{{ y }}</option>
        </select>
        <span class="text-xs font-bold text-stone-500">年</span>
        <select v-model.number="month" class="input-field w-14 !py-1.5 text-xs" @change="fetchCalendar">
          <option v-for="m in 12" :key="m" :value="m">{{ m }}</option>
        </select>
        <span class="text-xs font-bold text-stone-500">月</span>
      </div>
      <div class="flex items-center gap-1">
        <button class="btn-secondary !px-2.5 !py-1.5 text-xs" @click="prevMonth">
          <ChevronLeft :size="14" />
        </button>
        <button class="btn-secondary !px-3 !py-1.5 text-xs font-bold" @click="goToday">今天</button>
        <button class="btn-secondary !px-2.5 !py-1.5 text-xs" @click="nextMonth">
          <ChevronRight :size="14" />
        </button>
      </div>
    </div>

    <!-- Legend -->
    <div v-if="tasks.length" class="mb-3 flex flex-wrap items-center gap-2">
      <span class="text-[11px] font-bold text-stone-400">图例：</span>
      <span
        v-for="t in tasks"
        :key="t.id"
        class="cursor-pointer rounded px-2 py-0.5 text-[10px] font-semibold leading-none transition hover:ring-2 hover:ring-orange-200 border-l-[3px]"
        :class="[getBarClass(t), isSelected(t.id) ? 'ring-2 ring-[#e76f51]' : '']"
        :style="{ borderLeftColor: getDotColor(t) }"
        @click="selectedId = selectedId === t.id ? null : t.id"
      >{{ t.title }}</span>
    </div>

    <!-- Gantt calendar -->
    <div class="soft-card overflow-hidden">
      <div v-if="loading" class="grid min-h-[400px] place-items-center">
        <p class="text-xs text-stone-400">加载中...</p>
      </div>
      <div v-else class="overflow-x-auto">
        <!-- Column headers: day numbers -->
        <div class="flex border-b border-orange-100/70">
          <div class="w-10 shrink-0" />
          <div
            v-for="d in daysInMonth"
            :key="d"
            class="flex-1 border-l border-orange-50 py-2 text-center text-[10px] font-bold"
            :class="isWeekend(d) ? 'bg-orange-50/30 text-[#e76f51]' : isToday(d) ? 'bg-orange-50/40 text-[#e76f51]' : 'text-stone-400'"
          >
            {{ d }}
          </div>
        </div>

        <!-- Row: task bars -->
        <div class="relative" :style="{ minHeight: (tasks.length * 36 + 8) + 'px' }">
          <div
            v-for="(task, i) in tasks"
            :key="task.id"
            class="absolute left-10 right-0 flex h-8 items-center"
            :style="{ top: (i * 36 + 4) + 'px' }"
          >
            <div
              class="h-7 cursor-pointer rounded-full px-2 text-[10px] font-semibold leading-7 shadow-sm transition hover:shadow-md"
              :class="[getBarClass(task), isSelected(task.id) ? 'ring-2 ring-[#e76f51]' : '']"
              :style="barStyle(task)"
              :title="task.title"
              @click="selectedId = selectedId === task.id ? null : task.id"
            >
              <span class="block truncate">{{ task.title }}</span>
            </div>
          </div>

          <!-- Day grid lines -->
          <div class="absolute left-10 right-0 top-0 flex" :style="{ height: (tasks.length * 36 + 8) + 'px' }">
            <div
              v-for="d in daysInMonth"
              :key="d"
              class="flex-1 border-l border-orange-50"
              :class="isToday(d) ? 'bg-orange-50/20' : ''"
            />
          </div>
        </div>
      </div>

      <div v-if="!loading && tasks.length === 0" class="grid min-h-[200px] place-items-center">
        <p class="text-xs text-stone-400">本月暂无任务</p>
      </div>
    </div>

    <!-- Detail popup -->
    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="selectedId" class="fixed inset-0 z-50 flex items-start justify-center p-5 pt-[12vh]" @click.self="selectedId = null">
          <div class="soft-card w-full max-w-md p-5">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-sm font-extrabold text-stone-900">任务详情</h3>
              <button class="text-stone-400 hover:text-stone-700" @click="selectedId = null">
                <X :size="16" />
              </button>
            </div>

            <template v-if="selectedTask">
              <div class="space-y-3">
                <p class="text-sm font-bold text-stone-900">{{ selectedTask.title }}</p>
                <div class="flex flex-wrap gap-2">
                  <span class="rounded bg-[#fff1e6] px-2 py-0.5 text-[10px] font-semibold text-[#c65a3f]">{{ selectedTask.tag }}</span>
                  <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold" :class="statusPillClass(selectedTask.status)">
                    {{ statusLabel(selectedTask.status) }}
                  </span>
                  <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold" :class="priorityPillClass(selectedTask.priority)">
                    {{ priorityLabel(selectedTask.priority) }}优先级
                  </span>
                </div>
                <div class="space-y-1 text-xs text-stone-500">
                  <p v-if="selectedTask.startTime">开始：{{ formatTime(selectedTask.startTime) }}</p>
                  <p>截止：{{ formatTime(selectedTask.dueTime!) }}</p>
                  <p v-if="selectedTask.reminderHours">⏰ 提前 {{ formatReminder(selectedTask.reminderHours) }} 提醒</p>
                </div>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppShell>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, X } from '@lucide/vue'

interface CalTask {
  id: string
  title: string
  tag: string
  status: string
  priority: string
  startTime: string | null
  dueTime: string | null
  reminderHours: number | null
  reminded: boolean
}

const year = ref(new Date().getFullYear())
const month = ref(new Date().getMonth() + 1)
const tasks = ref<CalTask[]>([])
const loading = ref(false)
const selectedId = ref<string | null>(null)

const yearRange = computed(() => {
  const current = new Date().getFullYear()
  return Array.from({ length: 11 }, (_, i) => current - 5 + i)
})

const daysInMonth = computed(() => new Date(year.value, month.value, 0).getDate())

const selectedTask = computed(() => tasks.value.find((t) => t.id === selectedId.value) ?? null)

const barColors = [
  { bg: 'bg-[#e76f51] text-white', hex: '#e76f51' },
  { bg: 'bg-[#f4a261] text-white', hex: '#f4a261' },
  { bg: 'bg-[#2a9d8f] text-white', hex: '#2a9d8f' },
  { bg: 'bg-[#8ab17d] text-white', hex: '#8ab17d' },
  { bg: 'bg-[#b56576] text-white', hex: '#b56576' },
  { bg: 'bg-[#7b68ee] text-white', hex: '#7b68ee' },
  { bg: 'bg-[#e9c46a] text-stone-800', hex: '#e9c46a' },
  { bg: 'bg-[#4ecdc4] text-white', hex: '#4ecdc4' },
  { bg: 'bg-[#ff6b6b] text-white', hex: '#ff6b6b' },
  { bg: 'bg-[#a29bfe] text-white', hex: '#a29bfe' }
]

const colorMap = ref<Record<string, typeof barColors[0]>>({})

function getColor(id: string) {
  if (!colorMap.value[id]) {
    const keys = Object.keys(colorMap.value)
    colorMap.value[id] = barColors[keys.length % barColors.length]
  }
  return colorMap.value[id]
}

function getBarClass(task: CalTask) { return getColor(task.id).bg }
function getDotClass(task: CalTask) { return getColor(task.id).hex }
function getDotColor(task: CalTask) { return getColor(task.id).hex }
function isSelected(id: string) { return selectedId.value === id }

function isToday(d: number) {
  const now = new Date()
  return now.getFullYear() === year.value && now.getMonth() + 1 === month.value && now.getDate() === d
}

function isWeekend(d: number) {
  const date = new Date(year.value, month.value - 1, d)
  const dow = date.getDay()
  return dow === 0 || dow === 6
}

function barStyle(task: CalTask) {
  const totalDays = daysInMonth.value
  const monthStart = new Date(year.value, month.value - 1, 1).getTime()
  const monthEnd = new Date(year.value, month.value, 0, 23, 59, 59).getTime()

  const start = task.startTime
    ? Math.max(new Date(task.startTime).getTime(), monthStart)
    : task.dueTime
      ? new Date(task.dueTime).getTime()
      : monthStart
  const end = task.dueTime
    ? Math.min(new Date(task.dueTime).getTime(), monthEnd)
    : monthEnd

  const startDay = Math.max(1, Math.ceil((start - monthStart) / 86400000) + 1)
  const endDay = Math.min(totalDays, Math.ceil((end - monthStart) / 86400000) + 1)

  const leftPct = ((startDay - 1) / totalDays) * 100
  const widthPct = ((endDay - startDay + 1) / totalDays) * 100

  return {
    left: leftPct + '%',
    width: Math.max(widthPct, 2) + '%'
  }
}

async function fetchCalendar() {
  loading.value = true
  try {
    const api = useApi()
    const data = await api<{ tasks: CalTask[] }>(`/api/calendar?year=${year.value}&month=${month.value}`)
    tasks.value = data.tasks
  } catch {
    tasks.value = []
  } finally {
    loading.value = false
  }
}

function prevMonth() {
  if (month.value === 1) { year.value--; month.value = 12 }
  else { month.value-- }
  fetchCalendar()
}

function nextMonth() {
  if (month.value === 12) { year.value++; month.value = 1 }
  else { month.value++ }
  fetchCalendar()
}

function goToday() {
  const now = new Date()
  year.value = now.getFullYear()
  month.value = now.getMonth() + 1
  fetchCalendar()
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatReminder(hours: number) {
  if (hours >= 24) { const d = hours / 24; return Number.isInteger(d) ? `${d}天` : `${d}天` }
  if (hours >= 1) return Number.isInteger(hours) ? `${hours}小时` : `${hours}小时`
  return `${hours * 60}分钟`
}

function statusLabel(s: string) { return { todo: '待办', doing: '进行中', done: '已完成' }[s] ?? s }
function priorityLabel(p: string) { return { low: '低', medium: '中', high: '高' }[p] ?? p }

function statusPillClass(s: string) {
  return { todo: 'bg-stone-100 text-stone-500', doing: 'bg-[#fff4d8] text-[#d9902f]', done: 'bg-[#eef4e9] text-[#6f8f61]' }[s] ?? ''
}
function priorityPillClass(p: string) {
  return { low: 'bg-[#eef4e9] text-[#6f8f61]', medium: 'bg-[#fff4d8] text-[#d9902f]', high: 'bg-[#f8e8e6] text-[#b56576]' }[p] ?? ''
}

fetchCalendar()
</script>

<style scoped>
.dialog-enter-active, .dialog-leave-active { transition: opacity 0.2s ease; }
.dialog-enter-active .soft-card, .dialog-leave-active .soft-card { transition: transform 0.2s ease, opacity 0.2s ease; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-from .soft-card, .dialog-leave-to .soft-card { transform: scale(0.95) translateY(8px); opacity: 0; }
</style>
