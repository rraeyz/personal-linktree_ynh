import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { prisma } from '@/lib/prisma'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

async function getProfileData() {
  try {
    const profile = await prisma.profile.findFirst()
    return profile || null
  } catch (error) {
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfileData()
  
  const title = profile?.pageTitle || profile?.name || 'Personal Link Tree'
  const description = profile?.pageDescription || profile?.bio || 'Modern and minimalist personal link tree'
  const ogImage = profile?.ogImageUrl || profile?.imageUrl || '/og-image.png'
  const favicon = profile?.faviconUrl || '/favicon.ico'
  
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
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
