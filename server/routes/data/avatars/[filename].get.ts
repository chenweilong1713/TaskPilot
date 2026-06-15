import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const contentTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
}

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename')
  if (!filename || filename.includes('/') || filename.includes('..')) {
    throw createError({ statusCode: 400, statusMessage: '图片路径无效' })
  }

  const extension = extname(filename).toLowerCase()
  const contentType = contentTypes[extension]
  if (!contentType) {
    throw createError({ statusCode: 404, statusMessage: '图片不存在' })
  }

  try {
    const file = await readFile(join(process.cwd(), 'data', 'avatars', filename))
    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    return file
  } catch {
    throw createError({ statusCode: 404, statusMessage: '图片不存在' })
  }
})
