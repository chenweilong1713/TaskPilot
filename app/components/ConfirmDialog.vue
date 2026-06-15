<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-start justify-center p-5 pt-[15vh]" @click.self="$emit('cancel')">
        <div class="soft-card w-full max-w-sm p-6">
          <div class="flex items-start gap-3">
            <span class="mt-0.5 text-xl">{{ danger ? '⚠️' : '💡' }}</span>
            <div class="flex-1">
              <h3 class="text-sm font-extrabold text-stone-900">{{ title }}</h3>
              <p class="mt-1.5 text-xs text-stone-500 leading-relaxed">{{ message }}</p>
            </div>
          </div>

          <div class="mt-5 flex justify-end gap-2.5">
            <button class="btn-secondary text-xs" type="button" @click="$emit('cancel')">
              {{ cancelText }}
            </button>
            <button
              class="btn-primary text-xs"
              :class="danger ? '!bg-[#b56576] !shadow-[0_10px_18px_rgba(181,101,118,0.22)] hover:!bg-[#9f4d5e]' : ''"
              type="button"
              @click="$emit('confirm')"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  visible: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}>(), {
  confirmText: '确认',
  cancelText: '取消',
  danger: false
})

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}
.dialog-enter-active .soft-card,
.dialog-leave-active .soft-card {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
.dialog-enter-from .soft-card,
.dialog-leave-to .soft-card {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}
</style>
