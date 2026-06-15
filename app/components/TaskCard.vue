<template>
  <article
    class="soft-card cursor-pointer p-4 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
    @click="$emit('open', task)"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="truncate text-base font-semibold text-stone-900">{{ task.title }}</h3>
          <span :class="statusClass" class="rounded-full px-2.5 py-1 text-xs font-semibold">
            {{ statusLabels[task.status] }}
          </span>
          <span :class="priorityClass" class="rounded-full px-2.5 py-1 text-xs font-semibold">
            {{ priorityLabels[task.priority] }}优先级
          </span>
        </div>
        <p class="mt-2 text-sm text-stone-500">创建于 {{ formatDate(task.createdAt) }}</p>
        <p class="mt-1 text-sm text-stone-500">截止 {{ task.dueTime ? formatDate(task.dueTime) : '未设置' }}</p>
        <p v-if="task.reminderHours" class="mt-1 text-sm text-[#e76f51]">⏰ 提前 {{ formatReminder(task.reminderHours) }} 提醒</p>
      </div>

      <div class="flex shrink-0 items-center gap-2" @click.stop>
        <button class="btn-secondary px-3" type="button" @click="$emit('advance', task)">
          {{ task.status === 'done' ? '重置' : '下一状态' }}
        </button>
        <button class="btn-secondary px-3 text-[#b56576] hover:border-rose-200 hover:text-[#9f4d5e]" type="button" @click="$emit('delete', task)">
          删除
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Task } from '~/types/task'
import { priorityLabels, statusLabels } from '~/utils/taskLabels'

const props = defineProps<{
  task: Task
}>()

defineEmits<{
  open: [task: Task]
  advance: [task: Task]
  delete: [task: Task]
}>()

const statusClass = computed(() => ({
  todo: 'bg-stone-100 text-stone-700',
  doing: 'bg-[#fff4d8] text-[#d9902f]',
  done: 'bg-[#eef4e9] text-[#6f8f61]'
}[props.task.status]))

const priorityClass = computed(() => ({
  low: 'bg-[#eef4e9] text-[#6f8f61]',
  medium: 'bg-[#fff4d8] text-[#d9902f]',
  high: 'bg-[#f8e8e6] text-[#b56576]'
}[props.task.priority]))

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function formatReminder(hours: number) {
  if (hours >= 24) {
    const days = hours / 24
    return Number.isInteger(days) ? `${days} 天` : `${days} 天`
  }
  if (hours >= 1) {
    return Number.isInteger(hours) ? `${hours} 小时` : `${hours} 小时`
  }
  return `${hours * 60} 分钟`
}
</script>
