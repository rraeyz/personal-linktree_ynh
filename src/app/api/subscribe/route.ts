import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getClientIp, isRateLimited, isValidEmail } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    // Spam koruması: IP başına saatte 10 abonelik
    if (isRateLimited(`subscribe:${getClientIp(request.headers)}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.' },
        { status: 429 }
      )
    }

    const { email, name } = await request.json()

    // E-posta validasyonu
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Geçerli bir e-posta adresi girin' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    const safeName = typeof name === 'string' ? name.trim().slice(0, 100) : ''

    // Abone ekle veya güncelle
    await prisma.subscriber.upsert({
      where: { email: normalizedEmail },
      update: { name: safeName },
      create: {
        email: normalizedEmail,
        name: safeName,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Bültene başarıyla abone oldunuz!'
    })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Abonelik işlemi başarısız' },
      { status: 500 }
    )
  }
}
