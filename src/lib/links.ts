import bcrypt from 'bcryptjs'
import { isSafeUrl } from '@/lib/security'

// URL'si gerçekten açılan link tipleri (contact tipinde url alanı sadece başlıktır)
const URL_TYPES = new Set(['link', 'donation', 'embed-youtube', 'embed-twitter', 'embed-instagram'])

export function requiresSafeUrl(type: string | undefined): boolean {
  return URL_TYPES.has(type || 'link')
}

function parseDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const date = new Date(value as string)
  return isNaN(date.getTime()) ? null : date
}

function normalizeSlug(value: unknown): string {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 64)
}

const isBcryptHash = (value: string) => /^\$2[aby]\$\d{2}\$/.test(value)

// Admin panelinden gelen link verisini doğrular ve Prisma için hazırlar.
// existingPasswordHash: düzenlemede panel mevcut hash'i geri gönderir, bu durumda dokunulmaz.
export async function buildLinkData(
  body: Record<string, any>,
  existingPasswordHash?: string
): Promise<{ data: Record<string, any> } | { error: string }> {
  const data: Record<string, any> = {}

  if (body.title !== undefined) data.title = String(body.title).slice(0, 200)
  if (body.icon !== undefined) data.icon = String(body.icon || 'FaLink').slice(0, 500)
  if (body.category !== undefined) data.category = String(body.category || '').slice(0, 100)
  if (body.type !== undefined) data.type = String(body.type || 'link')
  if (body.passwordHint !== undefined) data.passwordHint = String(body.passwordHint || '').slice(0, 200)
  if (body.enabled !== undefined) data.enabled = !!body.enabled
  if (body.order !== undefined) data.order = parseInt(body.order) || 0
  if (body.slug !== undefined) data.slug = normalizeSlug(body.slug)

  const startDate = parseDate(body.startDate)
  if (startDate !== undefined) data.startDate = startDate
  const endDate = parseDate(body.endDate)
  if (endDate !== undefined) data.endDate = endDate

  if (body.url !== undefined) {
    const url = String(body.url).trim()
    if (requiresSafeUrl(data.type ?? body.type) && !isSafeUrl(url)) {
      return { error: 'Geçersiz URL. Sadece http(s), mailto ve tel linkleri kabul edilir.' }
    }
    data.url = url
  }

  if (body.password !== undefined) {
    const password = String(body.password || '')
    if (!password) {
      data.password = ''
    } else if (password === existingPasswordHash && isBcryptHash(password)) {
      // Değişmedi
    } else {
      data.password = await bcrypt.hash(password, 10)
    }
  }

  return { data }
}
