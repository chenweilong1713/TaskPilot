import { prisma } from '../utils/prisma'

let timer: ReturnType<typeof setInterval> | null = null
let currentInterval = 0

function shouldRemind(dueTime: Date, reminderHours: number): boolean {
  const now = Date.now()
  const remindAt = dueTime.getTime() - reminderHours * 60 * 60 * 1000
  // 提醒时间已到且未超过截止时间
  return remindAt <= now && now < dueTime.getTime()
}

async function sendWebhook(url: string, payload: unknown) {
  try {
    await $fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeout: 10000
    })
    return true
  } catch {
    return false
  }
}

function formatReminder(hours: number): string {
  if (hours >= 24) {
    const days = hours / 24
    return Number.isInteger(days) ? `${days}天` : `${days}天`
  }
  if (hours >= 1) {
    return Number.isInteger(hours) ? `${hours}小时` : `${hours}小时`
  }
  return `${hours * 60}分钟`
}

function buildMessage(title: string, dueTime: Date, reminderHours: number): string {
  const dueStr = dueTime.toLocaleString('zh-CN', { hour12: false })
  const remindStr = formatReminder(reminderHours)
  return `任务「${title}」将在 ${remindStr} 后截止（截止时间：${dueStr}），请及时处理。`
}

async function runReminderCheck() {
  try {
    // 读取所有用户的提醒配置
    const configs = await prisma.reminderConfig.findMany({
      where: { enabled: true }
    })

    if (configs.length === 0) return

    for (const config of configs) {
      // 查询该用户需要提醒的任务
      const tasks = await prisma.task.findMany({
        where: {
          status: { not: 'done' },
          reminded: false,
          dueTime: { not: null },
          reminderHours: { not: null }
        }
      })

      const tasksToRemind = tasks.filter((t) =>
        t.dueTime && t.reminderHours && shouldRemind(t.dueTime, t.reminderHours)
      )

      if (tasksToRemind.length === 0) continue

      // 查询该用户的所有 webhook
      const webhooks = await prisma.webhook.findMany({
        where: { userId: config.userId }
      })

      if (webhooks.length === 0) continue

      const payload = {
        type: 'task_reminder',
        timestamp: new Date().toISOString(),
        tasks: tasksToRemind.map((t) => ({
          id: t.id,
          title: t.title,
          tag: t.tag,
          status: t.status,
          priority: t.priority,
          dueTime: t.dueTime?.toISOString() ?? null,
          reminderHours: t.reminderHours,
          message: buildMessage(t.title, t.dueTime!, t.reminderHours!),
          createdAt: t.createdAt.toISOString()
        }))
      }
      console.log('定时任务')
      // 标记任务为已提醒
      await prisma.task.updateMany({
        where: { id: { in: tasksToRemind.map((t) => t.id) } },
        data: { reminded: true }
      })

      // 向所有 webhook 发送通知
      for (const webhook of webhooks) {
        console.log("准备发送", payload)
        const success = await sendWebhook(webhook.url, payload)
        if (success) {
          await prisma.webhook.update({
            where: { id: webhook.id },
            data: { updatedAt: new Date() }
          }).catch(() => undefined)
        }
      }
    }
  } catch {
    // 静默处理，避免定时任务崩溃
  }
}

async function syncInterval() {
  try {
    const configs = await prisma.reminderConfig.findMany({
      where: { enabled: true }
    })

    // 取所有用户中最小的间隔
    const minInterval = configs.length > 0
      ? Math.min(...configs.map((c) => c.intervalMinutes))
      : 0

    const intervalMs = minInterval > 0 ? minInterval * 60 * 1000 : 0

    if (intervalMs > 0 && intervalMs !== currentInterval) {
      if (timer) clearInterval(timer)
      currentInterval = intervalMs
      timer = setInterval(runReminderCheck, intervalMs)
    } else if (intervalMs === 0 && timer) {
      clearInterval(timer)
      timer = null
      currentInterval = 0
    }
  } catch {
    // 静默
  }
}

export default defineNitroPlugin(() => {
  // 启动时立即同步一次间隔
  syncInterval()

  // 每分钟检查一次配置变更
  setInterval(syncInterval, 60_000)
})
