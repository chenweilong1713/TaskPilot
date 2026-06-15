import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto'
import { prisma } from './prisma'

const defaultUsername = 'admin'
const defaultPassword = 'admin123'
const sessionDays = 7

export interface AuthUser {
  id: string
  username: string
  avatarUrl: string | null
  mustResetPassword: boolean
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false

  const actual = Buffer.from(hash, 'hex')
  const expected = scryptSync(password, salt, 64)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function createToken() {
  return randomBytes(32).toString('hex')
}

export function createExpiryDate() {
  const date = new Date()
  date.setDate(date.getDate() + sessionDays)
  return date
}

export async function ensureDefaultAdmin() {
  const userCount = await prisma.user.count()
  if (userCount > 0) return null

  const existing = await prisma.user.findUnique({
    where: { username: defaultUsername }
  })

  if (existing) return existing

  return prisma.user.create({
    data: {
      username: defaultUsername,
      passwordHash: hashPassword(defaultPassword),
      avatarUrl: null,
      mustResetPassword: true
    }
  })
}

export function toAuthUser(user: AuthUser) {
  return {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    mustResetPassword: user.mustResetPassword
  }
}

export async function getAuthenticatedUser(event: Parameters<typeof getHeader>[0]) {
  const authorization = getHeader(event, 'authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : ''

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: '请先登录' })
  }

  const tokenHash = hashToken(token)
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true }
  })

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined)
    } else {
      const accessToken = await prisma.accessToken.findUnique({
        where: { secretHash: tokenHash },
        include: { user: true }
      })

      if (accessToken && (!accessToken.expiresAt || accessToken.expiresAt.getTime() > Date.now())) {
        await prisma.accessToken.update({
          where: { id: accessToken.id },
          data: { lastUsedAt: new Date() }
        }).catch(() => undefined)

        return {
          token,
          tokenHash,
          session: null,
          accessToken,
          user: accessToken.user
        }
      }
    }
    throw createError({ statusCode: 401, statusMessage: '登录已过期' })
  }

  return {
    token,
    tokenHash,
    session,
    accessToken: null,
    user: session.user
  }
}
