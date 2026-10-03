import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { retentionDays } = await request.json()
    
    // -1 (süresiz) veya 0 ve üzeri değerler geçerli
    if (typeof retentionDays !== 'number' || retentionDays < -1) {
      return NextResponse.json(
        { error: 'Geçersiz saklama süresi' },
        { status: 400 }
      )
    }

    // Profile güncelle
    await prisma.profile.update({
      where: { id: 1 },
      data: {
        analyticsRetentionDays: retentionDays
      }
    })

    return NextResponse.json({ 
      success: true,
      retentionDays,
      message: retentionDays === -1
        ? 'Veriler sonsuza kadar saklanacak' 
        : `Veriler ${retentionDays} gün saklanacak`
    })
  } catch (error) {
    console.error('Analytics retention update error:', error)
    return NextResponse.json(
      { error: 'Ayar güncellenemedi' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { id: 1 },
      select: {
        analyticsRetentionDays: true
      }
    })

    return NextResponse.json({ 
      retentionDays: profile?.analyticsRetentionDays ?? 90
    })
  } catch (error) {
    console.error('Analytics retention fetch error:', error)
    return NextResponse.json(
      { error: 'Ayar alınamadı' },
      { status: 500 }
    )
  }
}
