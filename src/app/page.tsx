import { prisma } from '@/lib/prisma'
import ProfileSection from '@/components/ProfileSection'
import LinkButton from '@/components/LinkButton'
import DynamicBackground from '@/components/DynamicBackground'
import ThemeProvider from '@/components/ThemeProvider'
import ActionButtons from '@/components/ActionButtons'
import SocialEmbed from '@/components/SocialEmbed'
import ThemeToggle from '@/components/ThemeToggle'
import ThemeScript from '@/components/ThemeScript'
import ViewTracker from '@/components/ViewTracker'
import SocialIcons from '@/components/SocialIcons'
import TextBlock from '@/components/blocks/TextBlock'
import GalleryBlock from '@/components/blocks/GalleryBlock'
import SpotifyBlock from '@/components/blocks/SpotifyBlock'
import CountdownBlock from '@/components/blocks/CountdownBlock'
import PortfolioCard from '@/components/blocks/PortfolioCard'
import { parseImages, spotifyEmbedUrl } from '@/lib/links'
import { renderLinkIcon } from '@/lib/linkIcon'
import { hasInlineImages, migrateInlineImages } from '@/lib/uploads'
import { redirect } from 'next/navigation'
import { isSetupComplete } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function Home({ searchParams }: { searchParams?: { link?: string } }) {
  // /go/[slug] şifreli linkleri /?link=ID ile buraya yönlendirir, şifre penceresi otomatik açılır
  const autoOpenLinkId = parseInt(searchParams?.link || '')

  // Kurulum tamamlanmamışsa sihirbaza yönlendir
  if (!(await isSetupComplete())) {
    redirect('/setup')
  }

  // Profil bilgilerini al
  let profile
  try {
    profile = await prisma.profile.findFirst()
  } catch (error) {
    // Database not initialized
    redirect('/setup')
  }
  
  // İlk kez çalışıyorsa setup'a yönlendir
  if (!profile) {
    redirect('/setup')
  }

  // Eski sürümlerden kalan base64 görselleri bir kerelik dosyaya taşı
  if (hasInlineImages(profile)) {
    const currentProfile = profile
    const updates = await migrateInlineImages(currentProfile, (data) =>
      prisma.profile.update({ where: { id: currentProfile.id }, data })
    ).catch((error) => {
      console.error('Base64 görsel taşıma hatası:', error)
      return {}
    })
    profile = { ...profile, ...updates }
  }

  // Aktif linkleri sıralı şekilde al ve scheduled links'i filtrele
  const allLinks = await prisma.link.findMany({
    where: { enabled: true },
    orderBy: { order: 'asc' },
  })

  // Tarih kontrolü - sadece aktif scheduled links göster
  const now = new Date()
  const links = allLinks.filter(link => {
    // Başlangıç tarihi varsa ve henüz gelmemişse, gösterme
    if (link.startDate && new Date(link.startDate) > now) {
      return false
    }
    // Bitiş tarihi varsa ve geçmişse, gösterme
    if (link.endDate && new Date(link.endDate) < now) {
      return false
    }
    return true
  })

  // Kategorilere göre grupla
  const linksByCategory = links.reduce((acc: any, link: any) => {
    const category = link.category || 'Diğer'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(link)
    return acc
  }, {})

  const categories = Object.keys(linksByCategory).sort()

  const isGrid = profile.layout === 'grid'

  // Bento ızgarada tam genişlik kaplayan bloklar (içerik dar kutuya sığmaz)
  const isWideBlock = (link: any) =>
    link.featured || ['contact', 'text', 'gallery', 'spotify', 'countdown'].includes(link.type) || link.type?.startsWith('embed-')

  const renderBlock = (link: any) => {
    switch (link.type) {
      case 'text':
        return <TextBlock title={link.title} text={link.description} />
      case 'gallery':
        return <GalleryBlock title={link.title} images={parseImages(link.images)} />
      case 'spotify': {
        const embedUrl = spotifyEmbedUrl(link.url)
        return embedUrl ? <SpotifyBlock title={link.title} embedUrl={embedUrl} /> : null
      }
      case 'countdown':
        return link.targetDate ? (
          <CountdownBlock
            linkId={link.id}
            title={link.title}
            description={link.description}
            targetDate={new Date(link.targetDate).toISOString()}
            url={link.url}
          />
        ) : null
      case 'portfolio':
        return (
          <PortfolioCard
            linkId={link.id}
            title={link.title}
            description={link.description}
            image={link.thumbnail}
            url={link.url}
            featured={link.featured}
          />
        )
      case 'embed-youtube':
      case 'embed-twitter':
      case 'embed-instagram':
        return (
          <SocialEmbed
            url={link.url}
            type={link.type.replace('embed-', '') as 'youtube' | 'twitter' | 'instagram'}
            title={link.title}
          />
        )
      default:
        return (
          <LinkButton
            title={link.title}
            // Şifreli linklerin gerçek URL'si tarayıcıya gönderilmez; şifre doğrulanınca sunucudan alınır
            url={link.password ? '' : link.url}
            icon={link.icon}
            iconElement={link.icon.startsWith('http') ? undefined : renderLinkIcon(link.icon)}
            linkId={link.id}
            type={link.type}
            hasPassword={!!link.password}
            passwordHint={link.passwordHint}
            autoOpen={link.id === autoOpenLinkId}
            featured={link.featured}
            thumbnail={link.thumbnail}
            variant={isGrid && !isWideBlock(link) ? 'tile' : 'row'}
          />
        )
    }
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <ThemeScript />
      <ViewTracker />
      <ThemeProvider
        theme={{
          primaryColor: profile.primaryColor,
          accentColor: profile.accentColor,
          backgroundColor: profile.backgroundColor,
          cardColor: profile.cardColor,
          textColor: profile.textColor,
          buttonStyle: profile.buttonStyle,
          fontFamily: profile.fontFamily,
          borderRadius: profile.borderRadius,
          animationSpeed: profile.animationSpeed,
        }}
      />
      <DynamicBackground
        type={profile.backgroundType}
        backgroundColor={profile.backgroundColor}
        primaryColor={profile.primaryColor}
        accentColor={profile.accentColor}
        imageUrl={profile.backgroundImage}
        opacity={profile.backgroundOpacity}
      />
      
      {/* Theme Toggle */}
      <ThemeToggle />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
        <div className="w-full max-w-2xl mx-auto">
          <ProfileSection
            name={profile.name}
            bio={profile.bio}
            imageUrl={profile.imageUrl}
            verified={profile.verified}
            badges={profile.badges}
            coverImage={profile.coverImage}
          />

          {profile.showSocialIcons && (
            <SocialIcons
              linkedinUrl={profile.linkedinUrl}
              twitterUrl={profile.twitterUrl}
              discordUrl={profile.discordUrl}
              youtubeUrl={profile.youtubeUrl}
              instagramUrl={profile.instagramUrl}
              githubUrl={profile.githubUrl}
            />
          )}

          <div className="mt-8 space-y-4 w-full">
            {links.length === 0 ? (
              <p className="text-center text-gray-500 mt-12">
                Henüz link eklenmemiş
              </p>
            ) : (
              <>
                {categories.map((category) => (
                  <div key={category} className="space-y-4">
                    {/* Kategori Başlığı */}
                    {category !== 'Diğer' && linksByCategory[category].length > 0 && (
                      <div className="flex items-center gap-3 mt-8 first:mt-0">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-current to-transparent text-dynamic-primary opacity-30" />
                        <h3 className="text-sm font-medium text-dynamic-text opacity-70 uppercase tracking-wider">
                          {category}
                        </h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-current to-transparent text-dynamic-primary opacity-30" />
                      </div>
                    )}
                    
                    {/* Kategori Linkleri */}
                    <div className={isGrid ? 'grid grid-cols-2 gap-3' : 'space-y-4'}>
                      {linksByCategory[category].map((link: any) => (
                        <div key={link.id} className={isGrid && isWideBlock(link) ? 'col-span-2' : undefined}>
                          {renderBlock(link)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <ActionButtons
            title={`${profile.name} - Link Tree`}
            showVCard={profile.showVCard}
          />

          <footer className="mt-16 text-center text-gray-600 text-sm">
            <p>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </main>
  )
}
