import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { getBaseUrl } from '@/lib/url'
import { buildEmailHtml, isSmtpConfigured, loadMailProfile, senderAddress } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

// E-posta Gönder ekranındaki önizleme: gönderilecek e-postanın birebir HTML'i (imza dahil).
// Hiçbir şey göndermez; SMTP ayarlı olmasa da çalışır.
export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const subject = String(body.subject || '').slice(0, 300)
    const message = String(body.message || '').slice(0, 100_000)
    const toSubscribers = body.audience === 'subscribers'

    const profile = await loadMailProfile()
    if (!profile) return NextResponse.json({ error: 'Profil bulunamadı' }, { status: 404 })

    const baseUrl = getBaseUrl(request.headers)
    const html = buildEmailHtml(profile, {
      subject: subject || '(konu yok)',
      message: message || ' ',
      baseUrl,
      // Abonelere giden e-postada altta "Abonelikten çık" linki olur (önizlemede örnek adres)
      unsubscribeUrl: toSubscribers ? `${baseUrl}/unsubscribe` : undefined,
      viewInBrowserUrl: toSubscribers ? `${baseUrl}/` : undefined,
    })

    return NextResponse.json({
      html,
      from: isSmtpConfigured(profile) ? senderAddress(profile) : '',
      smtpConfigured: isSmtpConfigured(profile),
    })
  } catch (error) {
    console.error('Email preview error:', error)
    return NextResponse.json({ error: 'Önizleme oluşturulamadı' }, { status: 500 })
  }
}
