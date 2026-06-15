// ============================================
// Docker 容器入口脚本
// 1. 初始化数据库表结构
// 2. 创建默认管理员 (admin / admin123)
// 3. 启动 Nuxt 应用
// ============================================

import { execSync } from 'node:child_process'
import { randomBytes, scryptSync } from 'node:crypto'
import { existsSync, readFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const DB_PATH = resolve('/app/prisma/dev.db')
const DB_DIR = resolve('/app/prisma')
const INIT_SQL = resolve('/app/init.sql')

// ---- 确保数据库目录存在 ----
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true })
  console.log('[entrypoint] 创建数据库目录:', DB_DIR)
}

// ---- 第一步：初始化表结构 ----
if (!existsSync(DB_PATH)) {
  console.log('[entrypoint] 数据库不存在，从 init.sql 初始化表结构...')
  const sql = readFileSync(INIT_SQL, 'utf-8')
  execSync('sqlite3 "' + DB_PATH + '"', { input: sql })
  console.log('[entrypoint] 表结构初始化完成')
} else {
  console.log('[entrypoint] 数据库已存在，跳过表结构初始化')
}

// ---- 第二步：创建默认管理员 ----
const result = execSync('sqlite3 "' + DB_PATH + '" "SELECT COUNT(*) FROM User;"', { encoding: 'utf-8' }).trim()
if (result === '0') {
  console.log('[entrypoint] 创建默认管理员 admin / admin123...')

  // 生成密码哈希（与 server/utils/auth.ts 的 hashPassword 一致）
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync('admin123', salt, 64).toString('hex')
  const passwordHash = salt + ':' + hash
  const id = randomBytes(12).toString('hex')

  execSync('sqlite3 "' + DB_PATH + '" "INSERT INTO User (id, username, passwordHash, mustResetPassword, createdAt, updatedAt) VALUES (\'' + id + '\', \'admin\', \'' + passwordHash + '\', 1, datetime(\'now\'), datetime(\'now\'));"')
  console.log('[entrypoint] 默认管理员已创建: admin / admin123')
} else {
  console.log('[entrypoint] 用户已存在，跳过默认账户创建')
}

// ---- 第三步：启动应用 ----
console.log('[entrypoint] 启动 TaskPilot (端口 3000)...')
execSync('node .output/server/index.mjs', { stdio: 'inherit' })
