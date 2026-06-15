<template>
  <div class="fixed right-4 top-4 z-[80] flex w-[min(360px,calc(100vw-32px))] flex-col gap-2">
    <div
      v-for="item in toast.items"
      :key="item.id"
      class="rounded-[12px] border bg-white px-4 py-3 text-xs font-bold shadow-[0_18px_40px_rgba(154,84,45,0.14)]"
      :class="item.type === 'success' ? 'border-[#dcebd4] text-[#6f8f61]' : 'border-[#f1d3d0] text-[#b56576]'"
    >
      {{ item.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
const toast = useToastStore()
</script>
