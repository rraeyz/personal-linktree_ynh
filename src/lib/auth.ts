import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { cookies, headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export const AUTH_COOKIE = 'auth-token'
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7 // 7 gün

// Eski kurulumlarda .env'e yazılmış "henüz ayarlanmadı" değerleri
const PLACEHOLDER_VALUES = new Set([
  '',
  'admin123',
  'change-this-password',
  'auto-generated-on-first-setup',
  'set-during-initial-setup',
  'SETUP_REQUIRED',
])

const globalForAuth = globalThis as unknown as { fallbackJwtSecret?: string }

// JWT_SECRET her çağrıda okunur: setup sihirbazı process.env'i runtime'da günceller.
// Secret yoksa sabit bir değere DÜŞMEYİZ; process'e özel rastgele bir secret üretilir
// (restart sonrası oturumlar düşer ama kimse token taklit edemez).
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (secret && !PLACEHOLDER_VALUES.has(secret)) return secret
  if (!globalForAuth.fallbackJwtSecret) {
    globalForAuth.fallbackJwtSecret = crypto.randomBytes(32).toString('base64')
  }
  return globalForAuth.fallbackJwtSecret
}

export function signToken(payload: object): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' })
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, getJwtSecret())
  } catch (error) {
    return null
  }
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(AUTH_COOKIE)?.value || null
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken()
  if (!token) return false

  const payload = verifyToken(token)
  return !!payload
}

export async function setAuthCookie(username: string) {
  const token = signToken({ userId: 1, username })
  const cookieStore = await cookies()
  // Secure bayrağı isteğin gerçek protokolüne göre: HTTPS (YunoHost/nginx) → secure,
  // doğrudan http://sunucu:3000 erişimi → secure değil (yoksa tarayıcı cookie'yi kaydetmez, giriş yapılamaz)
  const proto = headers().get('x-forwarded-proto')?.split(',')[0].trim()
  const isHttps = proto ? proto === 'https' : false
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_MAX_AGE,
  })
}

// Eski sürümler admin şifresini düz metin olarak .env'de tutuyordu
function getLegacyEnvPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD
  if (!password || PLACEHOLDER_VALUES.has(password)) return null
  return password
}

function safeEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest()
  const hashB = crypto.createHash('sha256').update(b).digest()
  return crypto.timingSafeEqual(hashA, hashB)
}

export async function isSetupComplete(): Promise<boolean> {
  try {
    const adminCount = await prisma.admin.count()
    if (adminCount > 0) return true
  } catch (error) {
    // Database henüz hazır değil
  }
  return getLegacyEnvPassword() !== null
}

// Admin bilgilerini doğrular. Tek kaynak Admin tablosudur (bcrypt hash).
// Tablo boşsa eski .env şifresi kabul edilir ve ilk başarılı girişte tabloya taşınır.
export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  const admin = await prisma.admin.findFirst()

  if (admin) {
    const passwordOk = await bcrypt.compare(password, admin.passwordHash)
    return passwordOk && safeEqual(username, admin.username)
  }

  const legacyPassword = getLegacyEnvPassword()
  if (!legacyPassword) return false

  const legacyUsername = process.env.ADMIN_USERNAME || 'admin'
  if (!safeEqual(username, legacyUsername) || !safeEqual(password, legacyPassword)) {
    return false
  }

  await prisma.admin.create({
    data: {
      id: 1,
      username: legacyUsername,
      passwordHash: await bcrypt.hash(password, 12),
    },
  })
  return true
}
