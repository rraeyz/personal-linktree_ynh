import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { recordPageView, utmFromSearchParams } from '@/lib/analytics'
import { getClientIp, isRateLimited } from '@/lib/security'

export const dynamic = 'force-dynamic'

// Ana sayfa yüklendiğinde istemciden çağrılır (JS çalıştırmayan botlar zaten sayılmaz)
export async function POST(request: NextRequest) {
  try {
    // Admin kendi sayfasına bakınca istatistik şişmesin
    if (await isAuthenticated()) {
      return NextResponse.json({ recorded: false })
    }

    if (isRateLimited(`view:${getClientIp(request.headers)}`, 30, 60 * 1000)) {
      return NextResponse.json({ recorded: false }, { status: 429 })
    }

    let body: { referrer?: string; search?: string } = {}
    try {
      body = await request.json()
    } catch {
      // Gövdesiz istek
    }

    const recorded = await recordPageView(request.headers, {
      referrer: typeof body.referrer === 'string' ? body.referrer : '',
      utm: utmFromSearchParams(new URLSearchParams(typeof body.search === 'string' ? body.search : '')),
    })

    return NextResponse.json({ recorded })
  } catch (error) {
    console.error('Page view tracking error:', error)
    return NextResponse.json({ recorded: false }, { status: 500 })
  }
}
