import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Otomatik temizlik: Ayarlara göre eski verileri sil
    const profile = await prisma.profile.findUnique({
      where: { id: 1 },
      select: { analyticsRetentionDays: true }
    })
    
    if (profile && profile.analyticsRetentionDays > 0) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - profile.analyticsRetentionDays)
      
      await prisma.analytics.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'

    // Tarih aralığını hesapla
    const now = new Date()
    let startDate = new Date()
    
    if (range === '7d') {
      startDate.setDate(now.getDate() - 7)
    } else if (range === '30d') {
      startDate.setDate(now.getDate() - 30)
    } else if (range === 'all') {
      startDate = new Date(0) // Tüm zamanlar - epoch başlangıcından
    } else {
      startDate = new Date(0) // Default: Tüm zamanlar
    }

    // Analytics verilerini al
    const analytics = await prisma.analytics.findMany({
      where: {
        timestamp: {
          gte: startDate
        }
      },
      include: {
        link: {
          select: {
            title: true,
            category: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    // Eğer Analytics boşsa, Link.clicks verilerinden basit trend oluştur
    if (analytics.length === 0) {
      const links = await prisma.link.findMany({
        select: {
          id: true,
          title: true,
          clicks: true,
          category: true
        }
      })

      const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0)
      
      // Boş trend - Analytics verisi olmadığı için
      const dailyClicks = []
      const days = range === '7d' ? 7 : range === '30d' ? 30 : 7
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        dailyClicks.push({
          date: dateStr,
          count: 0 // Gerçek tarihli veri yok
        })
      }

      return NextResponse.json({
        total: totalClicks,
        devices: {},
        browsers: {},
        countries: {},
        referrers: {},
        dailyClicks: dailyClicks,
        recentClicks: []
      })
    }

    // Device breakdown
    const deviceStats = analytics.reduce((acc: any, item) => {
      const device = item.device || 'unknown'
      acc[device] = (acc[device] || 0) + 1
      return acc
    }, {})

    // Browser breakdown
    const browserStats = analytics.reduce((acc: any, item) => {
      const browser = item.browser || 'unknown'
      acc[browser] = (acc[browser] || 0) + 1
      return acc
    }, {})

    // Country breakdown
    const countryStats = analytics.reduce((acc: any, item) => {
      const country = item.country || 'unknown'
      acc[country] = (acc[country] || 0) + 1
      return acc
    }, {})

    // Top referrers
    const referrerStats = analytics.reduce((acc: any, item) => {
      const referrer = item.referrer || 'direct'
      acc[referrer] = (acc[referrer] || 0) + 1
      return acc
    }, {})

    // Daily clicks - range'e göre dinamik
    let dailyClicksArray: any[] = []
    
    if (range === 'all') {
      // Tüm zamanlar: Veritabanındaki en eski tarihten bugüne kadar TÜM günleri içer
      if (analytics.length > 0) {
        const dates = analytics.map(a => new Date(a.timestamp))
        const oldestDate = new Date(Math.min(...dates.map(d => d.getTime())))
        const today = new Date()
        
        // Tüm günleri doldur
        const dailyClicks: any = {}
        for (let d = new Date(oldestDate); d <= today; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0]
          dailyClicks[dateStr] = 0
        }
        
        // Gerçek verileri ekle
        analytics.forEach(item => {
          const dateStr = item.timestamp.toISOString().split('T')[0]
          dailyClicks[dateStr] = (dailyClicks[dateStr] || 0) + 1
        })
        
        dailyClicksArray = Object.entries(dailyClicks)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date))
      }
    } else {
      // 7d veya 30d: Sadece belirtilen gün sayısı kadar
      const days = range === '7d' ? 7 : 30
      const dailyClicks: any = {}
      
      // Son X günü doldur
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        dailyClicks[dateStr] = 0
      }

      // Gerçek verileri ekle
      analytics.forEach(item => {
        const dateStr = item.timestamp.toISOString().split('T')[0]
        if (dailyClicks[dateStr] !== undefined) {
          dailyClicks[dateStr]++
        }
      })
      
      dailyClicksArray = Object.entries(dailyClicks)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }

    return NextResponse.json({
      total: analytics.length,
      devices: deviceStats,
      browsers: browserStats,
      countries: countryStats,
      referrers: referrerStats,
      dailyClicks: dailyClicksArray,
      recentClicks: analytics.slice(0, 50)
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
