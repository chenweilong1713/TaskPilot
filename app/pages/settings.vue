<template>
  <AppShell>
    <div class="soft-card overflow-hidden" :class="{ 'pb-5': activeTab === 'tokens' }">
      <div class="border-b border-orange-100 px-5 pt-5">
        <div class="flex flex-wrap gap-5">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="relative pb-3 text-xs font-bold transition after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full"
            :class="[
              activeTab === tab.value ? 'text-[#c65a3f] after:bg-[#e76f51]' : 'text-stone-500 after:bg-transparent',
              tab.disabled ? 'cursor-not-allowed opacity-45' : ''
            ]"
            :disabled="tab.disabled"
            type="button"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <section v-if="activeTab === 'profile'" class="p-5">
        <div class="space-y-5">
          <div>
            <h2 class="text-sm font-extrabold text-stone-950">个人信息</h2>
            <p class="mt-1 text-xs text-stone-500">点击头像选择图片，确认选择后会自动上传到 data/avatars。</p>
          </div>

          <div class="flex items-center gap-4">
            <button class="relative h-16 w-16 overflow-hidden rounded-[18px] ring-4 ring-orange-50 transition hover:ring-orange-100" type="button" @click="avatarInput?.click()">
              <img class="h-full w-full object-cover" :src="previewAvatarUrl" alt="User avatar">
              <span class="absolute inset-x-0 bottom-0 bg-stone-950/55 py-1 text-[10px] font-bold text-white">
                {{ profileSubmitting ? '上传中' : '更换' }}
              </span>
            </button>
            <div>
              <p class="text-sm font-extrabold text-stone-900">{{ auth.user?.username ?? '-' }}</p>
              <p class="mt-1 text-xs text-stone-500">当前登录账号</p>
            </div>
          </div>

          <input
            ref="avatarInput"
            class="hidden"
            accept="image/jpeg,image/png,image/webp,image/gif"
            type="file"
            @change="handleAvatarChange"
          >
          <p class="text-xs text-stone-400">支持 jpg、png、webp、gif，最大 2MB。</p>

          <p v-if="profileMessage" class="rounded-[10px] bg-[#eef4e9] px-3 py-2 text-xs font-semibold text-[#6f8f61]">{{ profileMessage }}</p>
          <p v-if="profileError" class="rounded-[10px] bg-[#f8e8e6] px-3 py-2 text-xs font-semibold text-[#b56576]">{{ profileError }}</p>
        </div>
      </section>

      <section v-else-if="activeTab === 'tokens'" class="p-5">
        <div class="mb-5">
          <h2 class="text-sm font-extrabold text-stone-950">访问令牌</h2>
          <p class="mt-1 text-xs text-stone-500">创建访问令牌后，在请求头携带 <code class="rounded bg-stone-100 px-1 py-0.5 text-[11px]">Authorization: Bearer &lt;秘钥&gt;</code> 即可免登录访问 API。</p>
        </div>

        <form class="mb-6 rounded-2xl border border-orange-100 bg-orange-50/60 p-4" @submit.prevent="createToken">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label class="block">
              <span class="text-xs font-bold text-stone-700">令牌名称</span>
              <input v-model="tokenForm.name" class="input-field mt-2" placeholder="例如：CI/CD 部署" required type="text">
            </label>
            <label class="block">
              <span class="text-xs font-bold text-stone-700">秘钥</span>
              <div class="mt-2 flex gap-2">
                <input v-model="tokenForm.secret" class="input-field flex-1" placeholder="自定义或点击生成" type="text">
                <button class="btn-secondary shrink-0 !px-3 text-xs" type="button" @click="generateSecret">🎲 生成</button>
              </div>
            </label>
            <label class="block">
              <span class="text-xs font-bold text-stone-700">过期时间 <span class="font-normal text-stone-400">(空 = 永久)</span></span>
              <input v-model="tokenForm.expiresAt" class="input-field mt-2" type="datetime-local">
            </label>
          </div>

          <button class="btn-primary mt-4" :disabled="tokenSubmitting" type="submit">
            {{ tokenSubmitting ? '创建中...' : '创建令牌' }}
          </button>

          <p v-if="tokenError" class="mt-3 rounded-[10px] bg-[#f8e8e6] px-3 py-2 text-xs font-semibold text-[#b56576]">{{ tokenError }}</p>
        </form>

        <div v-if="newSecret" class="mb-6 rounded-2xl border border-[#eef4e9] bg-[#f4f9f0] p-4">
          <p class="text-xs font-extrabold text-[#5a8a4a]">✅ 令牌已创建</p>
<!--          <p class="mt-1 text-xs text-stone-600">请立即复制秘钥，关闭后将<strong>无法再次查看</strong>：</p>-->
          <div class="mt-2 flex items-center gap-2">
            <code class="flex-1 break-all rounded-lg bg-white px-3 py-2 text-xs font-mono text-stone-800 select-all">{{ newSecret }}</code>
            <button class="btn-secondary shrink-0 !px-3 text-xs" type="button" @click="copySecret">📋 复制</button>
          </div>
          <button class="mt-3 text-xs font-bold text-stone-500 hover:text-stone-700" type="button" @click="newSecret = ''">关闭</button>
        </div>

        <div v-if="tokenMessage" class="mb-4 rounded-[10px] bg-[#eef4e9] px-3 py-2 text-xs font-semibold text-[#6f8f61]">{{ tokenMessage }}</div>

        <div v-if="tokens.length" class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="border-b border-stone-200 text-stone-500">
              <tr>
                <th class="pb-2 pr-3 font-bold">名称</th>
                <th class="pb-2 pr-3 font-bold">秘钥</th>
                <th class="pb-2 pr-3 font-bold">过期时间</th>
                <th class="pb-2 pr-3 font-bold">最后使用</th>
                <th class="pb-2 pr-3 font-bold">创建时间</th>
                <th class="pb-2 text-right font-bold">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in tokens" :key="t.id" class="border-b border-stone-100">
                <td class="py-2.5 pr-3 font-semibold text-stone-800">{{ t.name }}</td>
                <td class="py-2.5 pr-3">
                  <span class="font-mono text-stone-500">{{ revealId === t.id ? t.secret : t.secretPreview }}</span>
                </td>
                <td class="py-2.5 pr-3">
                  <span v-if="t.expiresAt" class="text-stone-600">{{ formatDate(t.expiresAt) }}</span>
                  <span v-else class="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-[#c65a3f]">永久</span>
                </td>
                <td class="py-2.5 pr-3 text-stone-400">{{ t.lastUsedAt ? formatDate(t.lastUsedAt) : '从未使用' }}</td>
                <td class="py-2.5 pr-3 text-stone-400">{{ formatDate(t.createdAt) }}</td>
                <td class="py-2.5 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      class="text-xs font-bold text-stone-500 hover:text-stone-800 transition"
                      type="button"
                      @click="toggleReveal(t.id)"
                    >
                      {{ revealId === t.id ? '🙈 隐藏' : '👁 查看' }}
                    </button>
                    <button
                      v-if="revealId === t.id"
                      class="text-xs font-bold text-[#6f8f61] hover:text-[#5a8a4a] transition"
                      type="button"
                      @click="copyTokenSecret(t.secret)"
                    >
                      📋 复制
                    </button>
                    <button
                      class="text-xs font-bold text-[#b56576] hover:text-[#c65a3f] transition"
                      :disabled="deletingId === t.id"
                      type="button"
                      @click="deleteToken(t)"
                    >
                      {{ deletingId === t.id ? '删除中...' : '删除' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else-if="tokensLoaded" class="text-xs text-stone-400">暂无访问令牌，上方创建一个吧。</p>
        <p v-else class="text-xs text-stone-400">加载中...</p>
      </section>

      <section v-else-if="activeTab === 'webhooks'" class="p-5">
        <div class="mb-5">
          <h2 class="text-sm font-extrabold text-stone-950">Webhooks 配置</h2>
          <p class="mt-1 text-xs text-stone-500">添加 Webhook 地址后，任务状态变更时将向以下 URL 发送 <code class="rounded bg-stone-100 px-1 py-0.5 text-[11px]">POST</code> 请求。</p>
        </div>

        <form class="mb-6 rounded-2xl border border-orange-100 bg-orange-50/60 p-4" @submit.prevent="createWebhook">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="text-xs font-bold text-stone-700">标题</span>
              <input v-model="webhookForm.title" class="input-field mt-2" placeholder="例如：钉钉通知" required type="text">
            </label>
            <label class="block">
              <span class="text-xs font-bold text-stone-700">URL 地址 <span class="font-normal text-stone-400">(POST)</span></span>
              <input v-model="webhookForm.url" class="input-field mt-2" placeholder="https://hooks.example.com/..." required type="url">
            </label>
          </div>

          <button class="btn-primary mt-4" :disabled="webhookSubmitting" type="submit">
            {{ webhookSubmitting ? '添加中...' : '添加 Webhook' }}
          </button>

          <p v-if="webhookError" class="mt-3 rounded-[10px] bg-[#f8e8e6] px-3 py-2 text-xs font-semibold text-[#b56576]">{{ webhookError }}</p>
        </form>

        <div v-if="webhookMessage" class="mb-4 rounded-[10px] bg-[#eef4e9] px-3 py-2 text-xs font-semibold text-[#6f8f61]">{{ webhookMessage }}</div>

        <div v-if="webhooks.length" class="space-y-2">
          <div
            v-for="w in webhooks"
            :key="w.id"
            class="rounded-xl border border-stone-100 bg-white p-3 transition hover:border-orange-100"
            :class="editingId === w.id ? 'border-orange-200 ring-4 ring-orange-50' : ''"
          >
            <!-- 查看模式 -->
            <div v-if="editingId !== w.id" class="flex items-center gap-3">
              <div class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-orange-50 text-[#e76f51]">
                <span class="text-sm font-bold">⚡</span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs font-extrabold text-stone-900">{{ w.title }}</p>
                <p class="truncate text-[11px] text-stone-400 font-mono">{{ w.url }}</p>
              </div>
              <button
                class="shrink-0 text-xs font-bold text-stone-500 hover:text-stone-800 transition"
                type="button"
                @click="startEdit(w)"
              >
                编辑
              </button>
              <button
                class="shrink-0 text-xs font-bold text-[#b56576] hover:text-[#c65a3f] transition"
                :disabled="webhookDeleting === w.id"
                type="button"
                @click="deleteWebhook(w)"
              >
                {{ webhookDeleting === w.id ? '删除中...' : '删除' }}
              </button>
            </div>

            <!-- 编辑模式 -->
            <div v-else class="space-y-3">
              <label class="block">
                <span class="text-xs font-bold text-stone-700">标题</span>
                <input v-model="editForm.title" class="input-field mt-2" type="text">
              </label>
              <label class="block">
                <span class="text-xs font-bold text-stone-700">URL 地址</span>
                <input v-model="editForm.url" class="input-field mt-2" type="url">
              </label>
              <div class="flex justify-end gap-2">
                <button class="btn-secondary text-xs" type="button" @click="cancelEdit">取消</button>
                <button class="btn-primary text-xs" :disabled="webhookSaving" type="button" @click="saveEdit">
                  {{ webhookSaving ? '保存中...' : '保存' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <p v-else-if="webhooksLoaded" class="text-xs text-stone-400">暂无 Webhook，上方添加一个吧。</p>
        <p v-else class="text-xs text-stone-400">加载中...</p>
      </section>

      <section v-else-if="activeTab === 'reminder'" class="max-w-md p-5">
        <div class="mb-5">
          <h2 class="text-sm font-extrabold text-stone-950">提醒设置</h2>
          <p class="mt-1 text-xs text-stone-500">开启后，系统将定时检查任务提醒时间并通过 Webhook 发送通知。</p>
        </div>

        <div class="space-y-5">
          <label class="flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-stone-700">启用提醒</span>
              <p class="text-[11px] text-stone-400">关闭后所有提醒将停止</p>
            </div>
            <button
              class="relative h-6 w-11 rounded-full transition"
              :class="reminderConfig.enabled ? 'bg-[#e76f51]' : 'bg-stone-300'"
              type="button"
              @click="toggleReminder"
            >
              <span
                class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition"
                :class="reminderConfig.enabled ? 'left-[22px]' : 'left-0.5'"
              />
            </button>
          </label>

          <label class="block">
            <span class="text-xs font-bold text-stone-700">检测间隔（分钟）</span>
            <p class="text-[11px] text-stone-400">系统每隔指定分钟查询一次需要提醒的任务</p>
            <div class="mt-2 flex items-center gap-2">
              <input
                v-model.number="reminderConfig.intervalMinutes"
                class="input-field w-24"
                type="number"
                min="0.5"
                max="1440"
                step="0.5"
              >
              <span class="text-xs text-stone-400">分钟</span>
            </div>
          </label>

          <button class="btn-primary w-full" :disabled="reminderSaving" type="button" @click="saveReminderConfig">
            {{ reminderSaving ? '保存中...' : '保存设置' }}
          </button>

          <p v-if="reminderMessage" class="rounded-[10px] bg-[#eef4e9] px-3 py-2 text-xs font-semibold text-[#6f8f61]">{{ reminderMessage }}</p>
          <p v-if="reminderError" class="rounded-[10px] bg-[#f8e8e6] px-3 py-2 text-xs font-semibold text-[#b56576]">{{ reminderError }}</p>
        </div>
      </section>

      <section v-else-if="activeTab === 'password'" class="max-w-md p-5">
        <form class="space-y-4" @submit.prevent="savePassword">
          <div class="mb-5">
            <h2 class="text-sm font-extrabold text-stone-950">密码修改</h2>
            <p class="mt-1 text-xs text-stone-500">修改后请使用新密码登录。</p>
          </div>

          <label class="block">
            <span class="text-xs font-bold text-stone-700">原密码</span>
            <input v-model="passwordForm.oldPassword" class="input-field mt-2" autocomplete="current-password" required type="password">
          </label>
          <label class="block">
            <span class="text-xs font-bold text-stone-700">新密码</span>
            <input v-model="passwordForm.newPassword" class="input-field mt-2" autocomplete="new-password" required type="password">
          </label>
          <label class="block">
            <span class="text-xs font-bold text-stone-700">确认新密码</span>
            <input v-model="passwordForm.confirmPassword" class="input-field mt-2" autocomplete="new-password" required type="password">
          </label>

          <p v-if="passwordMessage" class="rounded-[10px] bg-[#eef4e9] px-3 py-2 text-xs font-semibold text-[#6f8f61]">{{ passwordMessage }}</p>
          <p v-if="passwordError" class="rounded-[10px] bg-[#f8e8e6] px-3 py-2 text-xs font-semibold text-[#b56576]">{{ passwordError }}</p>

          <button class="btn-primary w-full" :disabled="passwordSubmitting" type="submit">
            {{ passwordSubmitting ? '保存中...' : '修改密码' }}
          </button>
        </form>
      </section>
    </div>

  </AppShell>

    <!-- 删除确认弹窗 -->
    <ConfirmDialog
      :visible="deleteTarget !== null"
      title="确认删除"
      :message="deleteTarget ? `确认删除令牌「${deleteTarget.name}」？删除后无法恢复。` : ''"
      confirm-text="删除"
      cancel-text="取消"
      danger
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    />

    <!-- Webhook 删除确认弹窗 -->
    <ConfirmDialog
      :visible="webhookDeleteTarget !== null"
      title="确认删除"
      :message="webhookDeleteTarget ? `确认删除 Webhook「${webhookDeleteTarget.title}」？` : ''"
      confirm-text="删除"
      cancel-text="取消"
      danger
      @confirm="confirmDeleteWebhook"
      @cancel="webhookDeleteTarget = null"
    />
</template>

<script setup lang="ts">
const auth = useAuthStore()

const tabs = [
  { label: '个人信息', value: 'profile', disabled: false },
  { label: '访问令牌', value: 'tokens', disabled: false },
  { label: '密码修改', value: 'password', disabled: false },
  { label: 'Webhooks 配置', value: 'webhooks', disabled: false },
  { label: '提醒设置', value: 'reminder', disabled: false }
] as const

const activeTab = ref<(typeof tabs)[number]['value']>('profile')
const avatarFile = ref<File | null>(null)
const avatarInput = ref<HTMLInputElement | null>(null)
const avatarObjectUrl = ref<string | null>(null)
const profileSubmitting = ref(false)
const profileMessage = ref('')
const profileError = ref('')
const passwordSubmitting = ref(false)
const passwordMessage = ref('')
const passwordError = ref('')

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Access tokens
const tokens = ref<Array<{
  id: string
  name: string
  secret: string
  secretPreview: string
  expiresAt: string | null
  lastUsedAt: string | null
  createdAt: string
}>>([])
const tokensLoaded = ref(false)
const tokenForm = reactive({ name: '', secret: '', expiresAt: '' })
const tokenSubmitting = ref(false)
const tokenMessage = ref('')
const tokenError = ref('')
const newSecret = ref('')
const deletingId = ref<string | null>(null)
const revealId = ref<string | null>(null)
const deleteTarget = ref<{ id: string; name: string } | null>(null)
const webhooks = ref<Array<{
  id: string
  title: string
  url: string
  createdAt: string
}>>([])
const webhooksLoaded = ref(false)
const webhookForm = reactive({ title: '', url: '' })
const webhookSubmitting = ref(false)
const webhookMessage = ref('')
const webhookError = ref('')
const webhookDeleting = ref<string | null>(null)
const webhookDeleteTarget = ref<{ id: string; title: string } | null>(null)
const editingId = ref<string | null>(null)
const editForm = reactive({ title: '', url: '' })
const webhookSaving = ref(false)

// Reminder settings
const reminderConfig = reactive({ enabled: false, intervalMinutes: 1 })
const reminderLoaded = ref(false)
const reminderSaving = ref(false)
const reminderMessage = ref('')
const reminderError = ref('')



const previewAvatarUrl = computed(() => avatarObjectUrl.value || auth.avatarUrl)

async function handleAvatarChange(event: Event) {
  profileMessage.value = ''
  profileError.value = ''

  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  avatarFile.value = file

  if (avatarObjectUrl.value) {
    URL.revokeObjectURL(avatarObjectUrl.value)
    avatarObjectUrl.value = null
  }

  if (file) {
    avatarObjectUrl.value = URL.createObjectURL(file)
    await saveAvatar()
    input.value = ''
  }
}

async function saveAvatar() {
  if (!avatarFile.value) return

  profileSubmitting.value = true
  profileMessage.value = ''
  profileError.value = ''

  try {
    await auth.uploadAvatar(avatarFile.value)
    avatarFile.value = null
    if (avatarObjectUrl.value) {
      URL.revokeObjectURL(avatarObjectUrl.value)
      avatarObjectUrl.value = null
    }
    profileMessage.value = '头像已上传'
  } catch (error) {
    profileError.value = getErrorMessage(error)
  } finally {
    profileSubmitting.value = false
  }
}

async function savePassword() {
  passwordMessage.value = ''
  passwordError.value = ''

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = '两次输入的新密码不一致'
    return
  }

  passwordSubmitting.value = true
  try {
    await auth.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    passwordMessage.value = '密码已修改'
  } catch (error) {
    passwordError.value = getErrorMessage(error)
  } finally {
    passwordSubmitting.value = false
  }
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'data' in error) {
    const data = (error as { data?: { statusMessage?: string, message?: string } }).data
    return data?.statusMessage ?? data?.message ?? '操作失败'
  }
  return '操作失败'
}

function generateSecret() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'tp_'
  for (let i = 0; i < 40; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  tokenForm.secret = result
}

async function loadTokens() {
  tokensLoaded.value = false
  try {
    const api = useApi()
    const data = await api<typeof tokens.value>('/api/auth/access-tokens')
    tokens.value = data
    tokensLoaded.value = true
  } catch {
    tokensLoaded.value = true
  }
}

async function createToken() {
  tokenError.value = ''
  tokenMessage.value = ''
  newSecret.value = ''

  if (!tokenForm.name.trim()) {
    tokenError.value = '请输入令牌名称'
    return
  }

  if (!tokenForm.secret.trim()) {
    generateSecret()
  }

  tokenSubmitting.value = true
  try {
    const api = useApi()
    const data = await api<{ token: typeof tokens.value[0]; secret: string }>('/api/auth/access-tokens', {
      method: 'POST',
      body: {
        name: tokenForm.name.trim(),
        secret: tokenForm.secret.trim(),
        expiresAt: tokenForm.expiresAt || null
      }
    })
    newSecret.value = data.secret
    tokenForm.name = ''
    tokenForm.secret = ''
    tokenForm.expiresAt = ''
    await loadTokens()
  } catch (error) {
    tokenError.value = getErrorMessage(error)
  } finally {
    tokenSubmitting.value = false
  }
}

async function deleteToken(token: { id: string; name: string }) {
  deleteTarget.value = token
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  const id = deleteTarget.value.id
  deleteTarget.value = null
  deletingId.value = id
  tokenMessage.value = ''
  tokenError.value = ''
  try {
    const api = useApi()
    await api(`/api/auth/access-tokens/${id}`, { method: 'DELETE' })
    tokenMessage.value = '令牌已删除'
    await loadTokens()
  } catch (error) {
    tokenError.value = getErrorMessage(error)
  } finally {
    deletingId.value = null
  }
}

function toggleReveal(id: string) {
  revealId.value = revealId.value === id ? null : id
}

function copyTokenSecret(secret: string) {
  navigator.clipboard.writeText(secret)
  tokenMessage.value = '秘钥已复制到剪贴板'
}

function copySecret() {
  navigator.clipboard.writeText(newSecret.value)
  tokenMessage.value = '秘钥已复制到剪贴板'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', { hour12: false })
}

// Load tokens when tab is active
watch(activeTab, (val) => {
  if (val === 'tokens' && !tokensLoaded.value) {
    loadTokens()
  }
  if (val === 'webhooks' && !webhooksLoaded.value) {
    loadWebhooks()
  }
  if (val === 'reminder' && !reminderLoaded.value) {
    loadReminderConfig()
  }
})


function startEdit(webhook: { id: string; title: string; url: string }) {
  editingId.value = webhook.id
  editForm.title = webhook.title
  editForm.url = webhook.url
}

function cancelEdit() {
  editingId.value = null
  editForm.title = ''
  editForm.url = ''
}

async function saveEdit() {
  if (!editingId.value) return
  if (!editForm.title.trim() || !editForm.url.trim()) {
    webhookError.value = '标题和 URL 不能为空'
    return
  }

  webhookSaving.value = true
  webhookError.value = ''
  webhookMessage.value = ''
  try {
    const api = useApi()
    await api(`/api/webhooks/${editingId.value}`, {
      method: 'PUT',
      body: { title: editForm.title.trim(), url: editForm.url.trim() }
    })
    webhookMessage.value = 'Webhook 已更新'
    editingId.value = null
    await loadWebhooks()
  } catch (error) {
    webhookError.value = getErrorMessage(error)
  } finally {
    webhookSaving.value = false
  }
}


async function loadReminderConfig() {
  try {
    const api = useApi()
    const data = await api<{ enabled: boolean; intervalMinutes: number }>('/api/reminder-config')
    reminderConfig.enabled = data.enabled
    reminderConfig.intervalMinutes = data.intervalMinutes
    reminderLoaded.value = true
  } catch {
    reminderLoaded.value = true
    // use defaults
  }
}

async function saveReminderConfig() {
  reminderError.value = ''
  reminderMessage.value = ''

  if (reminderConfig.intervalMinutes < 0.5 || reminderConfig.intervalMinutes > 1440) {
    reminderError.value = '间隔需在 0.5 ~ 1440 分钟之间'
    return
  }

  reminderSaving.value = true
  try {
    const api = useApi()
    await api('/api/reminder-config', {
      method: 'PUT',
      body: {
        enabled: reminderConfig.enabled,
        intervalMinutes: reminderConfig.intervalMinutes
      }
    })
    reminderMessage.value = '提醒设置已保存'
  } catch (error) {
    reminderError.value = getErrorMessage(error)
  } finally {
    reminderSaving.value = false
  }
}

async function toggleReminder() {
  reminderConfig.enabled = !reminderConfig.enabled
  await saveReminderConfig()
}

async function loadWebhooks() {
  webhooksLoaded.value = false
  try {
    const api = useApi()
    const data = await api<typeof webhooks.value>('/api/webhooks')
    webhooks.value = data
    webhooksLoaded.value = true
  } catch {
    webhooksLoaded.value = true
  }
}

async function createWebhook() {
  webhookError.value = ''
  webhookMessage.value = ''

  if (!webhookForm.title.trim()) {
    webhookError.value = '请输入标题'
    return
  }
  if (!webhookForm.url.trim()) {
    webhookError.value = '请输入 URL 地址'
    return
  }

  webhookSubmitting.value = true
  try {
    const api = useApi()
    await api('/api/webhooks', {
      method: 'POST',
      body: {
        title: webhookForm.title.trim(),
        url: webhookForm.url.trim()
      }
    })
    webhookForm.title = ''
    webhookForm.url = ''
    webhookMessage.value = 'Webhook 已添加'
    await loadWebhooks()
  } catch (error) {
    webhookError.value = getErrorMessage(error)
  } finally {
    webhookSubmitting.value = false
  }
}

async function deleteWebhook(webhook: { id: string; title: string }) {
  webhookDeleteTarget.value = webhook
}

async function confirmDeleteWebhook() {
  if (!webhookDeleteTarget.value) return
  const target = webhookDeleteTarget.value
  webhookDeleteTarget.value = null
  webhookDeleting.value = target.id
  webhookMessage.value = ''
  webhookError.value = ''
  try {
    const api = useApi()
    await api(`/api/webhooks/${target.id}`, { method: 'DELETE' })
    webhookMessage.value = 'Webhook 已删除'
    await loadWebhooks()
  } catch (error) {
    webhookError.value = getErrorMessage(error)
  } finally {
    webhookDeleting.value = null
  }
}

</script>
