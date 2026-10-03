import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await request.json()

    if (!settings.version || !settings.profile) {
      return NextResponse.json(
        { error: 'Geçersiz ayar dosyası formatı' },
        { status: 400 }
      )
    }

    // Profil güncelle veya oluştur
    const existingProfile = await prisma.profile.findFirst()

    const profileData = {
      name: settings.profile.name || 'Your Name',
      bio: settings.profile.bio || '',
      imageUrl: settings.profile.imageUrl || '/default-avatar.jpg',
      faviconUrl: settings.profile.faviconUrl || '',
      pageTitle: settings.profile.pageTitle || 'Personal Link Tree',
      pageDescription: settings.profile.pageDescription || '',
      ogImageUrl: settings.profile.ogImageUrl || '',
      contactEmail: settings.profile.contactEmail || '',
      contactPhone: settings.profile.contactPhone || '',
      contactAddress: settings.profile.contactAddress || '',
      showVCard: settings.profile.showVCard ?? false,
      verified: settings.profile.verified || false,
      badges: settings.profile.badges || '',
      themePreset: settings.profile.themePreset || 'purple-dream',
      primaryColor: settings.profile.primaryColor || '#a855f7',
      accentColor: settings.profile.accentColor || '#ec4899',
      backgroundColor: settings.profile.backgroundColor || '#0a0a0a',
      cardColor: settings.profile.cardColor || '#1a1a1a',
      textColor: settings.profile.textColor || '#ffffff',
      buttonStyle: settings.profile.buttonStyle || 'gradient',
      fontFamily: settings.profile.fontFamily || 'Inter',
      borderRadius: settings.profile.borderRadius || 'xl',
      animationSpeed: settings.profile.animationSpeed || 'normal',
      backgroundType: settings.profile.backgroundType || 'gradient-blur',
      backgroundImage: settings.profile.backgroundImage || '',
      backgroundOpacity: settings.profile.backgroundOpacity ?? 100,
      coverImage: settings.profile.coverImage || '',
      layout: settings.profile.layout === 'grid' ? 'grid' : 'classic',
      darkMode: settings.profile.darkMode ?? true,
      analyticsRetentionDays: settings.profile.analyticsRetentionDays ?? 90,
      // SMTP Settings
      smtpHost: settings.profile.smtpHost || '',
      smtpPort: settings.profile.smtpPort || 587,
      smtpUser: settings.profile.smtpUser || '',
      smtpPassword: settings.profile.smtpPassword || '',
      smtpFrom: settings.profile.smtpFrom || '',
      smtpFromName: settings.profile.smtpFromName || '',
      smtpSecure: settings.profile.smtpSecure || false,
      // Email Signature
      companyName: settings.profile.companyName || '',
      companyAddress: settings.profile.companyAddress || '',
      linkedinUrl: settings.profile.linkedinUrl || '',
      twitterUrl: settings.profile.twitterUrl || '',
      discordUrl: settings.profile.discordUrl || '',
      youtubeUrl: settings.profile.youtubeUrl || '',
      instagramUrl: settings.profile.instagramUrl || '',
      githubUrl: settings.profile.githubUrl || '',
      showSocialIcons: settings.profile.showSocialIcons ?? true,
    }

    if (existingProfile) {
      await prisma.profile.update({
        where: { id: existingProfile.id },
        data: profileData,
      })
    } else {
      await prisma.profile.create({
        data: {
          id: 1, // Sabit ID kullan
          ...profileData,
        },
      })
    }

    // Mevcut linkleri sil (opsiyonel - üzerine yazma yerine)
    await prisma.link.deleteMany({})

    // Yeni linkleri oluştur
    if (settings.links && settings.links.length > 0) {
      for (const link of settings.links) {
        await prisma.link.create({
          data: {
            title: link.title,
            url: link.url,
            icon: link.icon,
            enabled: link.enabled,
            order: link.order,
            type: link.type || 'link',
            category: link.category || '',
            slug: link.slug || '',
            passwordHint: link.passwordHint || '',
            startDate: link.startDate ? new Date(link.startDate) : null,
            endDate: link.endDate ? new Date(link.endDate) : null,
            featured: !!link.featured,
            thumbnail: typeof link.thumbnail === 'string' ? link.thumbnail : '',
            description: typeof link.description === 'string' ? link.description : '',
            images: typeof link.images === 'string' ? link.images : '',
            targetDate: link.targetDate ? new Date(link.targetDate) : null,
            clicks: 0,
            password: '', // Güvenlik için şifreler içe aktarılmaz
          },
        })
      }
    }

    return NextResponse.json({ 
      message: 'Ayarlar başarıyla içe aktarıldı',
      imported: {
        profile: true,
        linksCount: settings.links?.length || 0
      }
    })
  } catch (error) {
    console.error('Import settings error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
