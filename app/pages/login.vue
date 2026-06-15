<template>
  <div class="grid min-h-screen place-items-center bg-[#fff8ef] px-4 py-10">
    <section class="w-full max-w-sm rounded-[20px] border border-orange-100 bg-white p-6 shadow-[0_18px_45px_rgba(154,84,45,0.08)]">
      <div class="mb-6 flex items-center gap-3">
        <div class="grid h-10 w-10 place-items-center rounded-xl bg-[#e76f51] text-white shadow-[0_10px_22px_rgba(231,111,81,0.25)]">
          <CheckCheck :size="20" />
        </div>
        <div>
          <p class="text-lg font-extrabold text-stone-950">TaskPilot</p>
          <p class="text-xs text-stone-500">{{ auth.mustResetPassword ? '首次登录请重置账号和密码' : '登录任务系统' }}</p>
        </div>
      </div>

      <form v-if="!auth.mustResetPassword" class="space-y-4" @submit.prevent="handleLogin">
        <label class="block">
          <span class="text-xs font-bold text-stone-700">账号</span>
          <input v-model="loginForm.username" class="input-field mt-2" autocomplete="username" required>
        </label>
        <label class="block">
          <span class="text-xs font-bold text-stone-700">密码</span>
          <input v-model="loginForm.password" class="input-field mt-2" autocomplete="current-password" required type="password">
        </label>
        <p v-if="errorMessage" class="rounded-[10px] bg-[#f8e8e6] px-3 py-2 text-xs font-semibold text-[#b56576]">{{ errorMessage }}</p>
        <button class="btn-primary w-full" :disabled="submitting" type="submit">
          {{ submitting ? '登录中...' : '登录' }}
        </button>
        <p class="text-center text-xs text-stone-400">默认账号：admin / admin123</p>
      </form>

      <form v-else class="space-y-4" @submit.prevent="handleResetPassword">
        <label class="block">
          <span class="text-xs font-bold text-stone-700">新账号</span>
          <input v-model="resetForm.username" class="input-field mt-2" autocomplete="username" required>
        </label>
        <label class="block">
          <span class="text-xs font-bold text-stone-700">原密码</span>
          <input v-model="resetForm.oldPassword" class="input-field mt-2" autocomplete="current-password" required type="password">
        </label>
        <label class="block">
          <span class="text-xs font-bold text-stone-700">新密码</span>
          <input v-model="resetForm.newPassword" class="input-field mt-2" autocomplete="new-password" required type="password">
        </label>
        <label class="block">
          <span class="text-xs font-bold text-stone-700">确认新密码</span>
          <input v-model="resetForm.confirmPassword" class="input-field mt-2" autocomplete="new-password" required type="password">
        </label>
        <p v-if="errorMessage" class="rounded-[10px] bg-[#f8e8e6] px-3 py-2 text-xs font-semibold text-[#b56576]">{{ errorMessage }}</p>
        <button class="btn-primary w-full" :disabled="submitting" type="submit">
          {{ submitting ? '保存中...' : '重置账号和密码并进入系统' }}
        </button>
        <button class="btn-secondary w-full" type="button" @click="auth.clearAuth">返回登录</button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { CheckCheck } from '@lucide/vue'

const auth = useAuthStore()
const submitting = ref(false)
const errorMessage = ref('')

const loginForm = reactive({
  username: '',
  password: ''
})

const resetForm = reactive({
  username: '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

async function handleLogin() {
  errorMessage.value = ''
  submitting.value = true

  try {
    const response = await auth.login(loginForm.username, loginForm.password)
    resetForm.username = response.user.username === 'admin' ? '' : response.user.username
    resetForm.oldPassword = loginForm.password

    if (!response.user.mustResetPassword) {
      await navigateTo('/')
    }
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    submitting.value = false
  }
}

async function handleResetPassword() {
  errorMessage.value = ''

  if (resetForm.username.trim().length < 3) {
    errorMessage.value = '新账号至少 3 位'
    return
  }

  if (resetForm.newPassword !== resetForm.confirmPassword) {
    errorMessage.value = '两次输入的新密码不一致'
    return
  }

  submitting.value = true
  try {
    await auth.resetPassword(resetForm.username.trim(), resetForm.oldPassword, resetForm.newPassword)
    await navigateTo('/')
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    submitting.value = false
  }
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'data' in error) {
    const data = (error as { data?: { statusMessage?: string, message?: string } }).data
    return data?.statusMessage ?? data?.message ?? '操作失败'
  }
  return '操作失败'
}
</script>
