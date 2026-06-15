<template>
  <div class="space-y-3">
    <div v-if="loading" class="soft-card p-8 text-center text-sm text-stone-500">任务加载中...</div>
    <div v-else-if="tasks.length === 0" class="soft-card p-10 text-center">
      <p class="text-base font-semibold text-stone-900">暂无任务</p>
      <p class="mt-2 text-sm text-stone-500">创建第一条任务后，这里会显示真实数据库中的任务列表。</p>
    </div>
    <TaskCard
      v-for="task in tasks"
      v-else
      :key="task.id"
      :task="task"
      @advance="$emit('advance', $event)"
      @delete="$emit('delete', $event)"
      @open="$emit('open', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { Task } from '~/types/task'

defineProps<{
  tasks: Task[]
  loading?: boolean
}>()

defineEmits<{
  open: [task: Task]
  advance: [task: Task]
  delete: [task: Task]
}>()
</script>
