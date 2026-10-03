import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { getBaseUrl } from '@/lib/url'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

async function getProfileData() {
  try {
    const profile = await prisma.profile.findFirst()
    return profile || null
  } catch (error) {
    return null
  }
}

function safeBaseUrl(): URL {
  try {
    return new URL(getBaseUrl(headers()))
  } catch {
    // Bozuk Host başlığı sayfayı çökertmesin
    return new URL('http://localhost:3000')
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfileData()
  
  const title = profile?.pageTitle || profile?.name || 'Personal Link Tree'
  const description = profile?.pageDescription || profile?.bio || 'Modern and minimalist personal link tree'
  // data: URI (eski base64 yüklemeler) sosyal medya önizlemelerinde çalışmaz; o durumda varsayılan avatar kullanılır
  const ogCandidate = profile?.ogImageUrl || profile?.imageUrl || '/default-avatar.jpg'
  const ogImage = ogCandidate.startsWith('data:') ? '/default-avatar.jpg' : ogCandidate
  const favicon = profile?.faviconUrl || '/favicon.png'
  
  return {
    // Göreli görsel yolları (/media/...) bu adrese göre tam URL'ye çevrilir; WhatsApp/Twitter önizlemesi için gerekli
    metadataBase: safeBaseUrl(),
    title,
    description,
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
    openGraph: {
      title,
      description,
      images: [ogImage],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning: açık/koyu mod sınıfı hydration'dan önce ThemeScript tarafından ekleniyor
    <html lang="tr" className={inter.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
