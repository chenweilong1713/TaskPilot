import { randomBytes } from 'node:crypto'

export function createAccessSecret() {
  return `tp_${randomBytes(24).toString('hex')}`
}

export function getSecretPreview(secret: string) {
  if (secret.length <= 12) return secret
  return `${secret.slice(0, 6)}...${secret.slice(-6)}`
}

export function toAccessTokenView(token: {
  id: string
  name: string
  secret: string
  secretPreview: string
  expiresAt: Date | null
  lastUsedAt: Date | null
  createdAt: Date
}) {
  return {
    id: token.id,
    name: token.name,
    secret: token.secret,
    secretPreview: token.secretPreview,
    expiresAt: token.expiresAt?.toISOString() ?? null,
    lastUsedAt: token.lastUsedAt?.toISOString() ?? null,
    createdAt: token.createdAt.toISOString()
  }
}
