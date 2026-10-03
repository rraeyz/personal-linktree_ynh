import { NextRequest, NextResponse } from 'next/server'
import { recordClick, utmFromSearchParams } from '@/lib/analytics'
import { getClientIp, isRateLimited } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const linkId = parseInt(params.id)

    // Sayaç şişirmeye karşı: IP başına dakikada 30 tıklama
    if (isRateLimited(`click:${getClientIp(request.headers)}`, 30, 60 * 1000)) {
      return NextResponse.json({ success: false }, { status: 429 })
    }

    // İstemci sayfaya nereden gelindiğini (document.referrer) ve sayfa URL'sindeki UTM'leri gönderir
    let body: { referrer?: string; search?: string } = {}
    try {
      body = await request.json()
    } catch {
      // Gövdesiz eski istemciler
    }

    const link = await recordClick(linkId, request.headers, {
      referrer: typeof body.referrer === 'string' ? body.referrer : undefined,
      utm: utmFromSearchParams(new URLSearchParams(typeof body.search === 'string' ? body.search : '')),
    })

    return NextResponse.json({ success: true, clicks: link.clicks })
  } catch (error) {
    console.error('Click tracking error:', error)
    return NextResponse.json(
      { error: 'Click tracking failed' },
      { status: 500 }
    )
  }
}
