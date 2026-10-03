import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { fetchLinkPreviewImage, PreviewError } from '@/lib/linkPreview'
import { isRateLimited } from '@/lib/security'

export const dynamic = 'force-dynamic'

// Admin: bir linkin önizleme görselini (og:image) otomatik çekip /media altına kaydeder
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (isRateLimited('link-preview', 30, 60 * 1000)) {
    return NextResponse.json({ error: 'Çok fazla istek, biraz bekleyin' }, { status: 429 })
  }

  const { url } = await request.json().catch(() => ({ url: '' }))
  if (typeof url !== 'string' || !url) {
    return NextResponse.json({ error: 'URL gerekli' }, { status: 400 })
  }

  try {
    return NextResponse.json({ url: await fetchLinkPreviewImage(url) })
  } catch (error) {
    if (error instanceof PreviewError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Link preview error:', error)
    return NextResponse.json({ error: 'Önizleme görseli alınamadı' }, { status: 500 })
  }
}
