import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getClientIp, isRateLimited } from '@/lib/security'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const linkId = parseInt(params.id)

    // Şifre deneme-yanılmasına karşı: IP + link başına 10 dakikada 10 deneme
    if (isRateLimited(`verify:${getClientIp(request.headers)}:${linkId}`, 10, 10 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: 'Çok fazla deneme. Lütfen biraz sonra tekrar deneyin.' },
        { status: 429 }
      )
    }

    const { password } = await request.json()

    const link = await prisma.link.findUnique({
      where: { id: linkId },
    })

    // Kapalı veya zamanı gelmemiş/geçmiş linkler şifreyle de açılamaz
    const now = new Date()
    const isActive = link && link.enabled &&
      !(link.startDate && link.startDate > now) &&
      !(link.endDate && link.endDate < now)

    if (!link || !isActive) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    if (!link.password) {
      return NextResponse.json({ error: 'Link is not password protected' }, { status: 400 })
    }

    const isValid = typeof password === 'string' && await bcrypt.compare(password, link.password)

    if (!isValid) {
      return NextResponse.json({
        success: false,
        error: 'Yanlış şifre'
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      url: link.url
    })
  } catch (error) {
    console.error('Password verification error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
