// ============================================
// 数据库种子脚本 — 创建默认管理员账户
// 用户名: admin  密码: admin123
// ============================================

import { randomBytes, scryptSync } from 'node:crypto'
import Database from 'better-sqlite3'
import { resolve } from 'node:path'

const DB_PATH = process.env.DATABASE_URL?.replace('file:', '') || resolve(process.cwd(), 'prisma', 'dev.db')

const db = new Database(DB_PATH)

// 检查是否已有用户
const existing = db.prepare('SELECT id FROM User LIMIT 1').get()
if (existing) {
  console.log('数据库已有用户，跳过种子数据。')
  db.close()
  process.exit(0)
}

// 生成密码哈希（与 server/utils/auth.ts 中的 hashPassword 一致）
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

const id = randomBytes(12).toString('hex')
const passwordHash = hashPassword('admin123')

db.prepare(`INSERT INTO User (id, username, passwordHash, mustResetPassword, createdAt, updatedAt)
  VALUES (?, 'admin', ?, 1, datetime('now'), datetime('now'))`).run(id, passwordHash)

console.log('默认管理员已创建: admin / admin123')
db.close()
