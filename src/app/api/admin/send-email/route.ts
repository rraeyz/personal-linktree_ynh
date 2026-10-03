import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import nodemailer from 'nodemailer'
import { generateEmailHTML, textToHTML } from '@/lib/emailTemplate'
import { getBaseUrl } from '@/lib/url'

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { to, subject, message } = await request.json()

    // Validasyon
    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Alıcı, konu ve mesaj gerekli' },
        { status: 400 }
      )
    }

    // Email formatını kontrol et
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Geçersiz e-posta adresi' },
        { status: 400 }
      )
    }

    // Profile ve SMTP ayarlarını çek
    const profile = await prisma.profile.findUnique({
      where: { id: 1 },
      select: {
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPassword: true,
        smtpFrom: true,
        smtpFromName: true,
        smtpSecure: true,
        companyName: true,
        companyAddress: true,
        imageUrl: true,
        linkedinUrl: true,
        twitterUrl: true,
        discordUrl: true,
        youtubeUrl: true,
        instagramUrl: true,
        githubUrl: true,
      }
    })

    if (!profile || !profile.smtpHost || !profile.smtpUser || !profile.smtpPassword) {
      return NextResponse.json(
        { error: 'SMTP ayarları yapılandırılmamış. Lütfen önce ayarlar sayfasından SMTP ayarlarını girin.' },
        { status: 400 }
      )
    }

    // Transporter oluştur
    const transporter = nodemailer.createTransport({
      host: profile.smtpHost,
      port: profile.smtpPort,
      secure: profile.smtpSecure,
      auth: {
        user: profile.smtpUser,
        pass: profile.smtpPassword,
      },
    })

    // Gönderen email formatı
    const senderAddress = profile.smtpFrom || profile.smtpUser
    const fromEmail = profile.smtpFromName
      ? `"${profile.smtpFromName}" <${senderAddress}>`
      : senderAddress

    // HTML email template oluştur
    const htmlContent = generateEmailHTML({
      subject,
      content: textToHTML(message),
      companyLogo: profile.imageUrl || undefined,
      companyName: profile.companyName,
      companyAddress: profile.companyAddress,
      socialLinks: {
        linkedin: profile.linkedinUrl,
        twitter: profile.twitterUrl,
        discord: profile.discordUrl,
        youtube: profile.youtubeUrl,
        instagram: profile.instagramUrl,
        github: profile.githubUrl,
      },
      baseUrl: getBaseUrl(request.headers),
    })

    // Email gönder
    await transporter.sendMail({
      from: fromEmail,
      to: to,
      subject: subject,
      html: htmlContent,
    })

    return NextResponse.json({
      success: true,
      message: `E-posta ${to} adresine başarıyla gönderildi`
    })

  } catch (error: any) {
    console.error('Custom email error:', error)
    return NextResponse.json(
      { error: 'E-posta gönderimi başarısız', details: error.message },
      { status: 500 }
    )
  }
}
