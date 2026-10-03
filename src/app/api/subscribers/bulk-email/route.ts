import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import nodemailer from 'nodemailer'
import { generateEmailHTML, textToHTML } from '@/lib/emailTemplate'
import { getBaseUrl } from '@/lib/url'
import { unsubscribeUrl } from '@/lib/unsubscribe'

// Email transporter yapılandırması - Database'den SMTP ayarlarını çek
const createTransporter = async () => {
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
    throw new Error('SMTP ayarları yapılandırılmamış. Ayarlar sayfasından SMTP ayarlarını girin.')
  }

  return { transporter: nodemailer.createTransport({
    host: profile.smtpHost,
    port: profile.smtpPort,
    secure: profile.smtpSecure,
    auth: {
      user: profile.smtpUser,
      pass: profile.smtpPassword,
    },
  }), profile }
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subject, message, subscriberIds } = await request.json()

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Konu ve mesaj gerekli' },
        { status: 400 }
      )
    }

    // Abone listesini al
    let subscribers
    if (subscriberIds && subscriberIds.length > 0) {
      // Belirli aboneler seçildiyse
      subscribers = await prisma.subscriber.findMany({
        where: {
          id: { in: subscriberIds }
        }
      })
    } else {
      // Tüm aboneler
      subscribers = await prisma.subscriber.findMany()
    }

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'Gönderilecek abone bulunamadı' },
        { status: 404 }
      )
    }

    // Email gönderimi - Transporter oluştur
    const { transporter, profile } = await createTransporter()
    const senderAddress = profile.smtpFrom || profile.smtpUser
    const fromEmail = profile.smtpFromName
      ? `"${profile.smtpFromName}" <${senderAddress}>`
      : senderAddress

    const baseUrl = getBaseUrl(request.headers)
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Paralel gönderim (her seferinde 5 email)
    const batchSize = 5
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(async (subscriber) => {
          try {
            // HTML email template kullan
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
              unsubscribeUrl: unsubscribeUrl(baseUrl, subscriber.email),
              viewInBrowserUrl: `${baseUrl}/`,
              baseUrl,
            })

            await transporter.sendMail({
              from: fromEmail,
              to: subscriber.email,
              subject: subject,
              html: htmlContent,
              // Gmail/Outlook'taki "Abonelikten çık" butonu (RFC 8058 tek tıkla çıkış)
              list: {
                unsubscribe: {
                  url: unsubscribeUrl(baseUrl, subscriber.email, '/api/unsubscribe'),
                  comment: 'Abonelikten çık',
                },
              },
              headers: { 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
            })
            results.success++
          } catch (error: any) {
            results.failed++
            results.errors.push(`${subscriber.email}: ${error.message}`)
          }
        })
      )
    }

    return NextResponse.json({
      message: `${results.success} e-posta başarıyla gönderildi`,
      success: results.success,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined
    })

  } catch (error: any) {
    console.error('Bulk email error:', error)
    return NextResponse.json(
      { error: 'E-posta gönderimi başarısız', details: error.message },
      { status: 500 }
    )
  }
}
