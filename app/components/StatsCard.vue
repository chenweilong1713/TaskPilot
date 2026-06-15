<template>
  <div class="soft-card p-4">
    <p class="text-xs font-bold text-stone-500">{{ label }}</p>
    <div class="mt-2 flex items-end justify-between gap-3">
      <p class="text-2xl font-extrabold text-stone-950">{{ value }}</p>
      <span v-if="hint" class="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-[#c65a3f]">{{ hint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  hint?: string
}>()
</script>
