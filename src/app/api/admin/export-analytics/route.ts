import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { CSV_BOM, csvRow } from '@/lib/csv'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Tüm analytics verilerini al
    const analytics = await prisma.analytics.findMany({
      include: {
        link: {
          select: {
            title: true,
            url: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    // CSV formatına dönüştür
    const csvHeader = 'Tarih,Saat,Link,URL,Cihaz,Tarayıcı,OS,Ülke,Şehir,Referrer,IP Hash\n'
    
    const csvRows = analytics.map(item => {
      const date = new Date(item.timestamp)
      const dateStr = date.toLocaleDateString('tr-TR')
      const timeStr = date.toLocaleTimeString('tr-TR')
      
      return csvRow([
        dateStr,
        timeStr,
        item.link.title,
        item.link.url,
        item.device || '',
        item.browser || '',
        item.os || '',
        item.country || '',
        item.city || '',
        item.referrer || 'Direkt',
        item.ipHash || ''
      ])
    }).join('\n')

    const csv = CSV_BOM + csvHeader + csvRows

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="analytics-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Analytics export error:', error)
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    )
  }
}
