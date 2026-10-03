import crypto from 'crypto'
import { getJwtSecret } from '@/lib/auth'

// Abonelikten çıkma linki için e-postaya özel imza: link tahmin edilemez, başkası adına çıkış yapılamaz
export function unsubscribeToken(email: string): string {
  return crypto.createHmac('sha256', getJwtSecret()).update(`unsubscribe:${email.toLowerCase()}`).digest('hex').slice(0, 32)
}

export function isValidUnsubscribeToken(email: string, token: string): boolean {
  const expected = Buffer.from(unsubscribeToken(email))
  const given = Buffer.from(String(token || ''))
  return expected.length === given.length && crypto.timingSafeEqual(expected, given)
}

export function unsubscribeUrl(baseUrl: string, email: string, path: '/unsubscribe' | '/api/unsubscribe' = '/unsubscribe'): string {
  const params = new URLSearchParams({ e: email, t: unsubscribeToken(email) })
  return `${baseUrl}${path}?${params.toString()}`
}
