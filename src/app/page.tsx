import { prisma } from '@/lib/prisma'
import ProfileSection from '@/components/ProfileSection'
import LinkButton from '@/components/LinkButton'
import DynamicBackground from '@/components/DynamicBackground'
import ThemeProvider from '@/components/ThemeProvider'
import ActionButtons from '@/components/ActionButtons'
import SocialEmbed from '@/components/SocialEmbed'
import ThemeToggle from '@/components/ThemeToggle'
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

  return (
    <main className="min-h-screen relative overflow-hidden">
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
          />

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
                    {linksByCategory[category].map((link: any) => {
                      // Embed tipleri için özel render
                      if (link.type?.startsWith('embed-')) {
                        const embedType = link.type.replace('embed-', '') as 'youtube' | 'twitter' | 'instagram'
                        return (
                          <SocialEmbed
                            key={link.id}
                            url={link.url}
                            type={embedType}
                            title={link.title}
                          />
                        )
                      }
                      
                      // Normal link button
                      return (
                        <LinkButton
                          key={link.id}
                          title={link.title}
                          // Şifreli linklerin gerçek URL'si tarayıcıya gönderilmez; şifre doğrulanınca sunucudan alınır
                          url={link.password ? '' : link.url}
                          icon={link.icon}
                          linkId={link.id}
                          type={link.type}
                          contactEmail={profile.contactEmail}
                          hasPassword={!!link.password}
                          passwordHint={link.passwordHint}
                          autoOpen={link.id === autoOpenLinkId}
                        />
                      )
                    })}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <ActionButtons 
            url={typeof window !== 'undefined' ? window.location.href : 'https://yoursite.com'}
            title={`${profile.name} - Link Tree`}
          />

          <footer className="mt-16 text-center text-gray-600 text-sm">
            <p>© 2026 {profile.name}. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </main>
  )
}
