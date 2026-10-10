import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { recordClick, utmFromSearchParams } from '@/lib/analytics'
import { getClientIp, isRateLimited, isSafeUrl } from '@/lib/security'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    slug: string
  }
  searchParams?: Record<string, string | string[] | undefined>
}

export default async function ShortLink({ params, searchParams }: PageProps) {
  const { slug } = params

  // Slug ile link'i bul
  const link = await prisma.link.findFirst({
    where: {
      slug: slug,
      enabled: true,
    },
  })

  // Link bulunamazsa 404
  if (!link) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <p className="text-xl text-gray-400 mb-8">Kısa link bulunamadı</p>
          <a
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    )
  }

  // Tarih kontrolü - scheduled links
  const now = new Date()
  if (link.startDate && new Date(link.startDate) > now) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-4">⏰ Henüz Aktif Değil</h1>
          <p className="text-gray-400 mb-2">Bu link henüz aktif değil.</p>
          <p className="text-sm text-gray-500">
            Başlangıç: {new Date(link.startDate).toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    )
  }

  if (link.endDate && new Date(link.endDate) < now) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-4">⏱️ Süresi Dolmuş</h1>
          <p className="text-gray-400">Bu linkin geçerlilik süresi dolmuş.</p>
        </div>
      </div>
    )
  }

  // Şifre korumalı ise ana sayfaya yönlendir
  if (link.password) {
    redirect(`/?link=${link.id}`)
  }

  // Analytics verisi kaydet (server-side). Yönlendirme her zaman yapılır; ama aynı IP dakikada
  // 30'dan fazla tıklama kaydettiremez (sayaç şişirme ve veritabanı büyütme engeli, click API ile aynı)
  try {
    const ip = getClientIp(headers() as unknown as Headers)
    if (!isRateLimited(`click:${ip}`, 30, 60 * 1000)) {
      await recordClick(link.id, headers(), {
        referrer: headers().get('referer') || '',
        utm: utmFromSearchParams(searchParams || {}),
      })
    }
  } catch (error) {
    console.error('Analytics tracking error:', error)
    // Hata olsa da devam et
  }

  // Hedef URL'ye yönlendir (yalnızca http(s)/mailto/tel)
  if (!isSafeUrl(link.url)) redirect('/')
  redirect(link.url)
}
