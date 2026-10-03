import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { pick } from '@/lib/security'
import { PROFILE_EDITABLE_FIELDS, toClientProfile } from '@/lib/profile'

export const dynamic = 'force-dynamic'

// Profil (SMTP ayarları dahil) sadece admin paneli içindir.
// Herkese açık sayfa veriyi doğrudan sunucu tarafında okur.
export async function GET() {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.profile.findFirst()
    return NextResponse.json(toClientProfile(profile))
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data: Record<string, any> = pick(body, PROFILE_EDITABLE_FIELDS)

    // Boş SMTP şifresi "değiştirme" anlamına gelir (panel kayıtlı şifreyi göstermez)
    if (!data.smtpPassword) delete data.smtpPassword
    if (data.smtpPort !== undefined) data.smtpPort = parseInt(data.smtpPort) || 587
    if (data.backgroundOpacity !== undefined) data.backgroundOpacity = parseInt(data.backgroundOpacity) || 0

    const existing = await prisma.profile.findFirst()

    const profile = existing
      ? await prisma.profile.update({ where: { id: existing.id }, data })
      : await prisma.profile.create({ data: { id: 1, ...data } })

    return NextResponse.json(toClientProfile(profile))
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
