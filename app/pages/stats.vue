<template>
  <AppShell>
    <div class="mb-4 flex flex-wrap justify-end gap-3">
      <button class="btn-secondary px-4" type="button" @click="filtersOpen = !filtersOpen">
        筛选
      </button>
      <div class="inline-flex rounded-[14px] border border-orange-100 bg-white p-1 shadow-[0_12px_30px_rgba(154,84,45,0.06)]">
        <button
          v-for="option in rangeOptions"
          :key="option.value"
          :class="days === option.value && !hasCustomRange ? 'bg-[#e76f51] text-white' : 'text-stone-600 hover:text-[#c65a3f]'"
          class="rounded-[10px] px-3 py-1.5 text-xs font-bold transition"
          type="button"
          @click="setQuickRange(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <form v-if="filtersOpen" class="soft-card mb-5 grid gap-3 p-4 sm:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end" @submit.prevent="applyStatsFilter">
      <label class="block">
        <span class="text-xs font-bold text-stone-600">日期范围</span>
        <select v-model="filterForm.due" class="input-field mt-2" @change="handleDuePresetChange">
          <option value="all">全部</option>
          <option value="today">本日</option>
          <option value="week">本周</option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs font-bold text-stone-600">开始时间</span>
        <input v-model="filterForm.start" class="input-field mt-2" type="datetime-local" @input="filterForm.due = 'all'">
      </label>
      <label class="block">
        <span class="text-xs font-bold text-stone-600">结束时间</span>
        <input v-model="filterForm.end" class="input-field mt-2" type="datetime-local" @input="filterForm.due = 'all'">
      </label>
      <div class="flex gap-2">
        <button class="btn-primary flex-1 sm:flex-none" type="submit">查询</button>
        <button class="btn-secondary flex-1 sm:flex-none" type="button" @click="resetStatsFilter">重置</button>
      </div>
    </form>

    <section class="soft-card mb-5 p-4">
      <h2 class="text-sm font-extrabold text-stone-950">统计摘要</h2>
      <p class="mt-2 text-xs leading-6 text-stone-600">
        当前共有 {{ summary?.total ?? 0 }} 条任务，已完成 {{ summary?.completed ?? 0 }} 条，
        进行中 {{ summary?.doing ?? 0 }} 条，整体完成率为 {{ summary?.completionRate ?? 0 }}%。
      </p>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatsCard label="总任务数" :value="summary?.total ?? 0" />
      <StatsCard label="完成任务数" :value="summary?.completed ?? 0" />
      <StatsCard label="未完成任务数" :value="summary?.uncompleted ?? 0" />
      <StatsCard label="完成率" :value="`${summary?.completionRate ?? 0}%`" />
    </section>

    <section class="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div class="soft-card p-4">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-sm font-extrabold text-stone-950">每日任务完成趋势</h2>
          <p class="rounded-[10px] border border-orange-100 px-3 py-1 text-xs font-bold text-stone-500">{{ rangeLabel }}</p>
        </div>
        <TrendChart :points="trend ?? []" />
      </div>

      <div class="soft-card p-4">
        <h2 class="text-sm font-extrabold text-stone-950">任务状态分布</h2>
        <StatusPieChart class="mt-4" :points="pie ?? []" />
      </div>
    </section>

  </AppShell>
</template>

<script setup lang="ts">
import type { PiePoint, StatsSummary, TrendPoint } from '~/types/task'

const auth = useAuthStore()
const days = ref<7 | 30>(7)
const filtersOpen = ref(false)
const summary = ref<StatsSummary | null>(null)
const pie = ref<PiePoint[]>([])
const trend = ref<TrendPoint[]>([])
const filterForm = reactive<{
  due: 'all' | 'today' | 'week'
  start: string
  end: string
}>({
  due: 'all',
  start: '',
  end: ''
})
const appliedRange = reactive({
  start: '',
  end: ''
})
const rangeOptions = [
  { label: '最近7天', value: 7 as const },
  { label: '最近30天', value: 30 as const }
]

const authHeaders = computed(() => auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined)
const hasCustomRange = computed(() => Boolean(appliedRange.start || appliedRange.end))
const rangeLabel = computed(() => {
  if (!hasCustomRange.value) return `最近 ${days.value} 天`
  return '自定义时间'
})

await refreshStats()

function setQuickRange(value: 7 | 30) {
  days.value = value
  filterForm.start = ''
  filterForm.end = ''
  appliedRange.start = ''
  appliedRange.end = ''
  refreshStats()
}

function applyStatsFilter() {
  appliedRange.start = filterForm.start ? new Date(filterForm.start).toISOString() : ''
  appliedRange.end = filterForm.end ? new Date(filterForm.end).toISOString() : ''
  refreshStats()
}

function resetStatsFilter() {
  filterForm.due = 'all'
  filterForm.start = ''
  filterForm.end = ''
  appliedRange.start = ''
  appliedRange.end = ''
  days.value = 7
  refreshStats()
}

async function refreshStats() {
  const query = {
    days: days.value,
    ...(appliedRange.start ? { start: appliedRange.start } : {}),
    ...(appliedRange.end ? { end: appliedRange.end } : {})
  }
  const headers = authHeaders.value
  const [summaryData, pieData, trendData] = await Promise.all([
    $fetch<StatsSummary>('/api/stats/summary', { headers, query }),
    $fetch<PiePoint[]>('/api/stats/pie', { headers, query }),
    $fetch<TrendPoint[]>('/api/stats/trend', { headers, query })
  ])

  summary.value = summaryData
  pie.value = pieData
  trend.value = trendData
}

function handleDuePresetChange() {
  if (filterForm.due === 'all') {
    filterForm.start = ''
    filterForm.end = ''
    return
  }

  const { start, end } = getDuePresetRange(filterForm.due)
  filterForm.start = toDateTimeLocal(start.toISOString())
  filterForm.end = toDateTimeLocal(end.toISOString())
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

function toDateTimeLocal(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}
</script>
