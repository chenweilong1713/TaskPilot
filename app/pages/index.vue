<template>
  <AppShell>
    <!-- 指标卡片 -->
    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="card in metricCards"
        :key="card.label"
        class="soft-card relative overflow-hidden p-4"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-bold text-stone-500">{{ card.label }}</p>
            <p class="mt-1 text-2xl font-extrabold text-stone-950">{{ card.value }}</p>
            <p class="mt-1 text-[11px] text-stone-400">{{ card.note }}</p>
          </div>
          <div class="grid h-10 w-10 place-items-center rounded-xl" :class="card.iconBg">
            <component :is="card.icon" :size="20" :class="card.iconColor" />
          </div>
        </div>
        <div class="mt-3 h-1 rounded-full bg-stone-100">
          <div class="h-1 rounded-full transition-all duration-700" :class="card.bar" :style="{ width: card.progress }" />
        </div>
      </div>
    </section>

    <section class="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <!-- 左侧：今日任务 + 趋势图 -->
      <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <!-- 今日任务 -->
        <div class="soft-card p-4">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-sm font-extrabold text-stone-950">今日任务</h2>
            <NuxtLink class="text-xs font-bold text-[#c65a3f] hover:underline" to="/tasks">查看全部 →</NuxtLink>
          </div>
          <div v-if="todayTasks.length" class="space-y-2">
            <div
              v-for="task in todayTasks"
              :key="task.id"
              class="flex items-center gap-3 rounded-lg p-2 transition hover:bg-orange-50/50"
            >
              <span
                class="grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px]"
                :class="task.status === 'done' ? 'border-[#8ab17d] bg-[#8ab17d] text-white' : 'border-stone-300 text-transparent'"
              >
                <Check :size="10" />
              </span>
              <p class="min-w-0 flex-1 truncate text-xs font-semibold" :class="task.status === 'done' ? 'text-stone-400 line-through' : 'text-stone-700'">
                {{ task.title }}
              </p>
              <span class="shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold" :class="tagClass(task.tag)">
                {{ task.tag }}
              </span>
              <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" :class="statusClass(task.status)">
                {{ statusLabel(task.status) }}
              </span>
              <span class="w-11 shrink-0 text-right text-[10px] text-stone-400">
                {{ task.dueTime ? formatTime(task.dueTime) : '-' }}
              </span>
            </div>
          </div>
          <p v-else class="py-6 text-center text-xs text-stone-400">今日暂无任务 🎉</p>
        </div>

        <!-- 本周趋势 -->
        <div class="soft-card p-4">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-sm font-extrabold text-stone-950">近 7 天完成趋势</h2>
            <span class="text-[11px] text-stone-400">已完成 {{ trendTotal }} 项</span>
          </div>
          <div v-if="trendBars.length" class="flex h-48 items-end gap-3 px-2">
            <div v-for="point in trendBars" :key="point.date" class="flex flex-1 flex-col items-center gap-2">
              <span class="text-[10px] font-semibold text-stone-500">{{ point.count || '' }}</span>
              <div class="flex h-36 w-full items-end rounded-[3px] bg-orange-50">
                <div
                  class="w-full rounded-[3px] bg-[#e76f51] transition-all duration-500"
                  :style="{ height: point.height }"
                />
              </div>
              <span class="text-[10px] text-stone-400">{{ point.label }}</span>
            </div>
          </div>
          <p v-else class="flex h-44 items-center justify-center text-xs text-stone-400">暂无数据</p>
        </div>
      </div>

      <!-- 右侧：状态分布 + 最近任务 -->
      <aside class="space-y-5">
        <!-- 状态分布 -->
        <div class="soft-card p-4">
          <h2 class="mb-4 text-sm font-extrabold text-stone-950">任务状态分布</h2>
          <div v-if="pieData.length" class="space-y-3">
            <div v-for="item in pieData" :key="item.label" class="flex items-center gap-3">
              <span class="h-3 w-3 shrink-0 rounded-full" :class="item.dot" />
              <span class="min-w-0 flex-1 text-xs text-stone-600">{{ item.label }}</span>
              <span class="text-xs font-bold text-stone-800">{{ item.value }}</span>
              <span class="w-10 text-right text-[10px] text-stone-400">{{ item.pct }}%</span>
            </div>
            <!-- 进度条 -->
            <div class="flex h-2 overflow-hidden rounded-full bg-stone-100">
              <div
                v-for="(item, i) in pieData"
                :key="i"
                class="h-full transition-all duration-500"
                :class="item.bar"
                :style="{ width: item.pct + '%' }"
              />
            </div>
          </div>
          <p v-else class="py-4 text-center text-xs text-stone-400">暂无数据</p>
        </div>

        <!-- 最近任务 -->
        <div class="soft-card p-4">
          <h2 class="mb-4 text-sm font-extrabold text-stone-950">最近创建</h2>
          <div v-if="recentTasks.length" class="space-y-2">
            <div
              v-for="task in recentTasks"
              :key="task.id"
              class="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-orange-50/50"
            >
              <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="priorityDot(task.priority)" />
              <p class="min-w-0 flex-1 truncate text-xs text-stone-700">{{ task.title }}</p>
              <span class="shrink-0 text-[10px] text-stone-400">{{ formatRelative(task.createdAt) }}</span>
            </div>
          </div>
          <p v-else class="py-4 text-center text-xs text-stone-400">暂无任务</p>
        </div>
      </aside>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { Check, CheckCircle2, Clock3, Flame, ListTodo } from '@lucide/vue'

const auth = useAuthStore()

// ---- 数据加载 ----
interface TaskItem {
  id: string; title: string; tag: string; status: string; priority: string
  dueTime: string | null; createdAt: string; reminderHours: number | null
}

const summary = ref({ total: 0, completed: 0, doing: 0, todo: 0, overdue: 0, completionRate: 0 })
const todayTasks = ref<TaskItem[]>([])
const trendData = ref<{ date: string; completed: number }[]>([])
const pieData = ref<{ label: string; value: number; pct: number; dot: string; bar: string }[]>([])
const recentTasks = ref<TaskItem[]>([])
const loading = ref(true)

// ---- 指标卡片 ----
const metricCards = computed(() => [
  {
    label: '任务总数', value: summary.value.total, note: '所有状态任务',
    progress: '100%', bar: 'bg-[#e76f51]', icon: ListTodo,
    iconBg: 'bg-[#fff1e6]', iconColor: 'text-[#e76f51]'
  },
  {
    label: '已完成', value: summary.value.completed,
    note: `完成率 ${summary.value.completionRate}%`,
    progress: summary.value.completionRate + '%', bar: 'bg-[#8ab17d]',
    icon: CheckCircle2, iconBg: 'bg-[#eef4e9]', iconColor: 'text-[#6f8f61]'
  },
  {
    label: '进行中', value: summary.value.doing,
    note: summary.value.todo > 0 ? `还有 ${summary.value.todo} 项待办` : '全部开始',
    progress: summary.value.total ? Math.round((summary.value.doing / summary.value.total) * 100) + '%' : '0%',
    bar: 'bg-[#f4a261]', icon: Clock3, iconBg: 'bg-[#fff4d8]', iconColor: 'text-[#d9902f]'
  },
  {
    label: '已逾期', value: summary.value.overdue,
    note: summary.value.overdue > 0 ? '请尽快处理' : '暂无逾期',
    progress: summary.value.overdue > 0 ? '100%' : '0%',
    bar: summary.value.overdue > 0 ? 'bg-[#b56576]' : 'bg-stone-200',
    icon: Flame, iconBg: 'bg-[#f8e8e6]', iconColor: 'text-[#b56576]'
  }
])

// ---- 趋势图 ----
const trendBars = computed(() => {
  if (!trendData.value.length) return []
  const max = Math.max(...trendData.value.map((d) => d.completed), 1)
  return trendData.value.map((d) => {
    const date = new Date(d.date)
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    return {
      date: d.date,
      label: weekDays[date.getDay()],
      count: d.completed,
      height: Math.round((d.completed / max) * 100) + '%'
    }
  })
})

const trendTotal = computed(() => trendData.value.reduce((s, d) => s + d.completed, 0))

// ---- 工具函数 ----
const tagColorMap: Record<string, string> = {}
const tagClasses = [
  'bg-[#fff1e6] text-[#c65a3f]',
  'bg-[#eef4e9] text-[#6f8f61]',
  'bg-[#fff4d8] text-[#d9902f]',
  'bg-[#f8e8e6] text-[#b56576]',
  'bg-[#e8f0fe] text-[#4a6fa5]'
]

function tagClass(tag: string) {
  if (!tagColorMap[tag]) {
    tagColorMap[tag] = tagClasses[Object.keys(tagColorMap).length % tagClasses.length]
  }
  return tagColorMap[tag]
}

function statusLabel(s: string) {
  return { todo: '待办', doing: '进行中', done: '已完成' }[s] ?? s
}

function statusClass(s: string) {
  return {
    todo: 'bg-stone-100 text-stone-500',
    doing: 'bg-[#fff4d8] text-[#d9902f]',
    done: 'bg-[#eef4e9] text-[#6f8f61]'
  }[s] ?? ''
}

function priorityDot(p: string) {
  return { high: 'bg-[#e76f51]', medium: 'bg-[#f4a261]', low: 'bg-[#8ab17d]' }[p] ?? 'bg-stone-300'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

// ---- 数据获取 ----
async function fetchAll() {
  loading.value = true
  const api = useApi()
  const now = Date.now()

  // 汇总统计
  try {
    const s = await api<{ total: number; completed: number; doing: number; completionRate: number }>('/api/stats/summary')
    summary.value = { ...s, todo: 0, overdue: 0 }
  } catch {}

  // 今日任务
  try {
    todayTasks.value = await api<TaskItem[]>('/api/tasks/today')
  } catch {}

  // 任务列表（用于逾期统计、最近创建）
  let tasks: TaskItem[] = []
  try {
    tasks = await api<TaskItem[]>('/api/tasks?pageSize=999')
    const overdue = tasks.filter((t) => t.status !== 'done' && t.dueTime && new Date(t.dueTime).getTime() < now).length
    const todo = tasks.filter((t) => t.status === 'todo').length
    summary.value = { ...summary.value, todo, overdue }
    recentTasks.value = tasks.slice(0, 6)
  } catch {}

  // 趋势
  try {
    const trend = await api<{ date: string; completed: number }[]>('/api/stats/trend?days=7')
    trendData.value = trend
  } catch {}

  // 状态分布
  try {
    const pie = await api<{ label: string; value: number }[]>('/api/stats/pie')
    const total = pie.reduce((sum, p) => sum + p.value, 0) || 1
    const pieColors = [
      { dot: 'bg-stone-400', bar: 'bg-stone-300' },
      { dot: 'bg-[#f4a261]', bar: 'bg-[#f4a261]' },
      { dot: 'bg-[#8ab17d]', bar: 'bg-[#8ab17d]' }
    ]
    pieData.value = pie.map((p, i) => ({
      label: p.label,
      value: p.value,
      pct: Math.round((p.value / total) * 100),
      dot: pieColors[i].dot,
      bar: pieColors[i].bar
    }))
  } catch {}

  loading.value = false
}

fetchAll()
</script>
