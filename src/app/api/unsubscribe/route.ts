import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidUnsubscribeToken } from '@/lib/unsubscribe'

export const dynamic = 'force-dynamic'

// Hem /unsubscribe sayfasındaki buton hem de e-posta istemcilerinin "tek tıkla abonelikten çık"
// (RFC 8058, List-Unsubscribe-Post) isteği buraya gelir. E-posta ve imza sorgu dizesinde veya JSON gövdede olabilir.
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  let email = searchParams.get('e') || ''
  let token = searchParams.get('t') || ''

  if (!email && request.headers.get('content-type')?.includes('application/json')) {
    const body = await request.json().catch(() => ({}))
    email = typeof body.email === 'string' ? body.email : ''
    token = typeof body.token === 'string' ? body.token : ''
  }

  if (!email || !isValidUnsubscribeToken(email, token)) {
    return NextResponse.json({ error: 'Geçersiz abonelikten çıkma linki' }, { status: 400 })
  }

  await prisma.subscriber.deleteMany({ where: { email: email.toLowerCase() } })
  return NextResponse.json({ success: true })
}
