import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const authenticated = await isAuthenticated()
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Tüm ayarları topla
    const profile = await prisma.profile.findFirst()
    const links = await prisma.link.findMany({
      orderBy: { order: 'asc' }
    })

    const settings = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      profile: profile ? {
        name: profile.name,
        bio: profile.bio,
        imageUrl: profile.imageUrl,
        faviconUrl: profile.faviconUrl,
        pageTitle: profile.pageTitle,
        pageDescription: profile.pageDescription,
        ogImageUrl: profile.ogImageUrl,
        contactEmail: profile.contactEmail,
        contactPhone: profile.contactPhone,
        contactAddress: profile.contactAddress,
        verified: profile.verified,
        badges: profile.badges,
        themePreset: profile.themePreset,
        primaryColor: profile.primaryColor,
        accentColor: profile.accentColor,
        backgroundColor: profile.backgroundColor,
        cardColor: profile.cardColor,
        textColor: profile.textColor,
        buttonStyle: profile.buttonStyle,
        fontFamily: profile.fontFamily,
        borderRadius: profile.borderRadius,
        animationSpeed: profile.animationSpeed,
        backgroundType: profile.backgroundType,
        backgroundImage: profile.backgroundImage,
        backgroundOpacity: profile.backgroundOpacity,
        darkMode: profile.darkMode,
        analyticsRetentionDays: profile.analyticsRetentionDays,
        // SMTP Settings
        smtpHost: profile.smtpHost,
        smtpPort: profile.smtpPort,
        smtpUser: profile.smtpUser,
        smtpPassword: profile.smtpPassword,
        smtpFrom: profile.smtpFrom,
        smtpFromName: profile.smtpFromName,
        smtpSecure: profile.smtpSecure,
        // Email Signature
        companyName: profile.companyName,
        companyAddress: profile.companyAddress,
        linkedinUrl: profile.linkedinUrl,
        twitterUrl: profile.twitterUrl,
        discordUrl: profile.discordUrl,
        youtubeUrl: profile.youtubeUrl,
        instagramUrl: profile.instagramUrl,
        githubUrl: profile.githubUrl,
      } : null,
      links: links.map(link => ({
        title: link.title,
        url: link.url,
        icon: link.icon,
        enabled: link.enabled,
        order: link.order,
        type: link.type,
        category: link.category,
        slug: link.slug,
        passwordHint: link.passwordHint,
        startDate: link.startDate,
        endDate: link.endDate,
        // Şifreleri dışa aktarma (güvenlik için isteğe bağlı)
        hasPassword: !!link.password
      }))
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Export settings error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
