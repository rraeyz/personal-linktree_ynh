import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Tüm analytics verilerini sil
    const result = await prisma.analytics.deleteMany({})
    await prisma.pageView.deleteMany({})
    
    // Link clicks'leri de sıfırla
    await prisma.link.updateMany({
      data: {
        clicks: 0
      }
    })

    return NextResponse.json({ 
      success: true, 
      deleted: result.count,
      message: `${result.count} analytics kaydı silindi ve tüm tıklama sayaçları sıfırlandı`
    })
  } catch (error) {
    console.error('Analytics clear error:', error)
    return NextResponse.json(
      { error: 'Analytics temizleme başarısız' },
      { status: 500 }
    )
  }
}
