<template>
  <div class="min-h-screen bg-[#fff8ef]">
    <aside class="fixed inset-y-0 left-0 z-20 hidden w-[220px] border-r border-orange-100/70 bg-white px-5 py-6 lg:flex lg:flex-col">
      <div class="flex items-center gap-2.5">
        <div class="grid h-7 w-7 place-items-center rounded-[10px] bg-[#e76f51] text-white shadow-[0_10px_22px_rgba(231,111,81,0.25)]">
          <CheckCheck :size="15" />
        </div>
        <p class="text-sm font-extrabold text-stone-950">TaskPilot</p>
      </div>

      <nav class="mt-8 flex-1 space-y-1.5">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-xs font-semibold text-stone-600 transition hover:bg-orange-50 hover:text-[#c65a3f]"
          active-class="!bg-[#e76f51] !text-white shadow-[0_12px_24px_rgba(231,111,81,0.22)]"
        >
          <component :is="item.icon" :size="15" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="border-t border-orange-100/70 pt-4">
        <NuxtLink
          to="/settings"
          class="flex items-center gap-2.5 rounded-[12px] border border-orange-100 bg-[#fff8ef] p-2.5 transition hover:border-orange-200 hover:bg-orange-50"
        >
          <img class="h-8 w-8 rounded-full object-cover ring-3 ring-white" :src="auth.avatarUrl" alt="User avatar">
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-extrabold text-stone-900">{{ auth.user?.username ?? 'Alex' }}</p>
            <p class="truncate text-[11px] text-stone-500">设置</p>
          </div>
          <ChevronDown :size="13" class="-rotate-90 text-stone-400" />
        </NuxtLink>

        <button
          class="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-500 transition hover:border-[#b56576] hover:text-[#b56576]"
          type="button"
          @click="auth.logout"
        >
          <LogOut :size="13" />
          退出登录
        </button>
      </div>
    </aside>

    <div class="lg:pl-[220px]">
      <header class="sticky top-0 z-10 bg-[#fff8ef]/90 backdrop-blur">
        <div class="flex h-14 items-center px-4 sm:px-7 lg:px-8">
          <template v-if="route.path === '/'">
            <h1 class="text-lg font-extrabold text-stone-950">
              {{ greeting }}，{{ auth.user?.username ?? '用户' }}
            </h1>
            <p class="ml-3 text-xs text-stone-400">欢迎回到 TaskPilot</p>
          </template>
          <h1 v-else class="text-lg font-extrabold text-stone-950">{{ pageTitle }}</h1>
        </div>
      </header>

      <main class="px-4 pb-7 pt-3 sm:px-7 lg:px-8">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BarChart3, CalendarDays, CheckCheck, ChevronDown, Home, ListTodo, LogOut } from '@lucide/vue'

const route = useRoute()
const auth = useAuthStore()

const navItems = [
  { label: '首页', to: '/', icon: Home },
  { label: '任务', to: '/tasks', icon: ListTodo },
  { label: '日历', to: '/calendar', icon: CalendarDays },
  { label: '统计', to: '/stats', icon: BarChart3 }
]


const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const pageTitle = computed(() => {
  if (route.path === '/settings') return '设置'
  const item = navItems.find((navItem) => navItem.to === route.path)
  return item?.label ?? 'TaskPilot'
})

</script>
