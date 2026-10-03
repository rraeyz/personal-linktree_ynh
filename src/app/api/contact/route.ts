import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'
import { escapeHtml, getClientIp, isRateLimited, isValidEmail } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    // Spam koruması: IP başına saatte 5 mesaj
    if (isRateLimited(`contact:${getClientIp(request.headers)}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Çok fazla mesaj gönderildi. Lütfen daha sonra tekrar deneyin.' },
        { status: 429 }
      )
    }

    const { name, email, message, website } = await request.json()

    // Honeypot: gerçek kullanıcılar bu gizli alanı doldurmaz, botlar doldurur
    if (website) {
      return NextResponse.json({ success: true, message: 'Mesajınız alındı, en kısa sürede dönüş yapılacaktır.' })
    }

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Geçerli bir e-posta adresi girin' }, { status: 400 })
    }

    if (String(name).length > 100 || String(message).length > 5000) {
      return NextResponse.json({ error: 'Mesaj çok uzun' }, { status: 400 })
    }

    // Profil + SMTP ayarlarını database'den al (admin panelden girilen)
    const profile = await prisma.profile.findFirst()

    if (!profile || !profile.contactEmail) {
      return NextResponse.json(
        { error: 'Contact email not configured' },
        { status: 400 }
      )
    }

    // SMTP ayarları database'de yoksa hata ver
    if (!profile.smtpHost || !profile.smtpUser || !profile.smtpPassword) {
      return NextResponse.json(
        { error: 'SMTP ayarları yapılandırılmamış' },
        { status: 500 }
      )
    }

    const transporter = nodemailer.createTransport({
      host: profile.smtpHost,
      port: profile.smtpPort,
      secure: profile.smtpSecure,
      auth: {
        user: profile.smtpUser,
        pass: profile.smtpPassword,
      },
    })

    const fromEmail = profile.smtpFromName
      ? `"${profile.smtpFromName}" <${profile.smtpFrom || profile.smtpUser}>`
      : profile.smtpFrom || profile.smtpUser

    // Ziyaretçiden gelen her değer HTML'e konmadan önce escape edilir
    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeMessage = escapeHtml(message)
    const cleanName = String(name).replace(/[\r\n]+/g, ' ')

    await transporter.sendMail({
      from: fromEmail,
      to: profile.contactEmail,
      replyTo: email,
      subject: `İletişim Formu - ${cleanName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #a855f7; border-bottom: 2px solid #ec4899; padding-bottom: 10px;">
            Yeni İletişim Formu Mesajı
          </h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>İsim:</strong> ${safeName}</p>
            <p><strong>E-posta:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
          </div>
          <div style="background-color: #fff; padding: 20px; border-left: 4px solid #a855f7; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Mesaj:</h3>
            <p style="color: #666; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</p>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center;">
            Tarih: ${new Date().toLocaleString('tr-TR')}
          </p>
        </div>
      `,
      text: `İsim: ${cleanName}\nE-posta: ${email}\n\nMesaj:\n${message}`,
    })

    return NextResponse.json({
      success: true,
      message: 'Mesajınız alındı, en kısa sürede dönüş yapılacaktır.'
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Mesaj gönderilemedi' },
      { status: 500 }
    )
  }
}
