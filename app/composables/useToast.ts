type ToastType = 'success' | 'error'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

export const useToastStore = defineStore('toast', () => {
  const items = ref<ToastItem[]>([])
  let nextId = 1

  function show(message: string, type: ToastType = 'success') {
    if (!import.meta.client) return

    const id = nextId++
    items.value.push({ id, type, message })
    window.setTimeout(() => remove(id), 3000)
  }

  function success(message: string) {
    show(message, 'success')
  }

  function error(message: string) {
    show(message, 'error')
  }

  function remove(id: number) {
    items.value = items.value.filter((item) => item.id !== id)
  }

  return {
    items,
    success,
    error,
    remove
  }
})
