import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { getBaseUrl } from '@/lib/url'
import { isValidEmail } from '@/lib/security'
import {
  buildEmailHtml,
  buildEmailText,
  createMailTransport,
  isSmtpConfigured,
  loadMailProfile,
  parseRecipients,
  senderAddress,
} from '@/lib/mailer'

// Tek gönderimde en fazla bu kadar alıcı (her birine ayrı e-posta gider, adresler birbirini görmez)
const MAX_RECIPIENTS = 20

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()

    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { to, subject, message } = await request.json()
    const recipients = parseRecipients(to)

    // Validasyon
    if (recipients.length === 0 || !subject || !message) {
      return NextResponse.json(
        { error: 'Alıcı, konu ve mesaj gerekli' },
        { status: 400 }
      )
    }
    if (recipients.length > MAX_RECIPIENTS) {
      return NextResponse.json(
        { error: `Tek seferde en fazla ${MAX_RECIPIENTS} alıcıya gönderilebilir. Daha fazlası için abonelere toplu gönderimi kullanın.` },
        { status: 400 }
      )
    }
    const invalid = recipients.filter((email) => !isValidEmail(email))
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: invalid.length === 1 && recipients.length === 1 ? 'Geçersiz e-posta adresi' : `Geçersiz e-posta adresi: ${invalid.join(', ')}` },
        { status: 400 }
      )
    }

    // Profil ve SMTP ayarları
    const profile = await loadMailProfile()
    if (!isSmtpConfigured(profile)) {
      return NextResponse.json(
        { error: 'SMTP ayarları yapılandırılmamış. Lütfen önce ayarlar sayfasından SMTP ayarlarını girin.' },
        { status: 400 }
      )
    }

    const transporter = createMailTransport(profile)
    const from = senderAddress(profile)
    const content = { subject, message, baseUrl: getBaseUrl(request.headers) }
    const html = buildEmailHtml(profile, content)
    const text = buildEmailText(profile, content)

    // Her alıcıya ayrı e-posta (sırayla: SMTP sunucusu hız sınırına takılmasın)
    const failed: string[] = []
    for (const recipient of recipients) {
      try {
        await transporter.sendMail({ from, to: recipient, subject, html, text })
      } catch (error: any) {
        console.error('Custom email error:', recipient, error?.message)
        failed.push(`${recipient}: ${error?.message || 'gönderilemedi'}`)
      }
    }

    const sent = recipients.length - failed.length
    if (sent === 0) {
      return NextResponse.json(
        { error: 'E-posta gönderimi başarısız', details: failed.join('; ') },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sent,
      failed: failed.length,
      errors: failed.length > 0 ? failed : undefined,
      message: recipients.length === 1
        ? `E-posta ${recipients[0]} adresine başarıyla gönderildi`
        : `E-posta ${sent} adrese gönderildi${failed.length ? `, ${failed.length} adrese gönderilemedi` : ''}`,
    })
  } catch (error: any) {
    console.error('Custom email error:', error)
    return NextResponse.json(
      { error: 'E-posta gönderimi başarısız', details: error.message },
      { status: 500 }
    )
  }
}
