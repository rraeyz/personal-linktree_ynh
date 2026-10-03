import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Docker healthcheck için: veri döndürmez, sadece uygulama + database ayakta mı
export async function GET() {
  try {
    await prisma.profile.count()
    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    return NextResponse.json({ status: 'error' }, { status: 503 })
  }
}
