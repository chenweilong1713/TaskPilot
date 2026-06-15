import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { getAuthenticatedUser, toAuthUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const extensionByType: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
}

export default defineEventHandler(async (event) => {
  const { user } = await getAuthenticatedUser(event)
  const form = await readMultipartFormData(event)
  const file = form?.find((item) => item.name === 'avatar')

  if (!file?.data || !file.type || !allowedTypes.has(file.type)) {
    throw createError({ statusCode: 400, statusMessage: '请上传 jpg、png、webp 或 gif 图片' })
  }

  if (file.data.byteLength > 2 * 1024 * 1024) {
    throw createError({ statusCode: 400, statusMessage: '图片大小不能超过 2MB' })
  }

  const dataDir = join(process.cwd(), 'data', 'avatars')
  await mkdir(dataDir, { recursive: true })

  const originalExt = extname(file.filename ?? '').toLowerCase()
  const safeExt = originalExt && ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(originalExt)
    ? originalExt
    : extensionByType[file.type]
  const filename = `${user.id}-${Date.now()}-${randomBytes(6).toString('hex')}${safeExt}`
  const filePath = join(dataDir, filename)

  await writeFile(filePath, file.data)

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: `/data/avatars/${filename}` }
  })

  return {
    user: toAuthUser(updatedUser)
  }
})
