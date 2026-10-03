import { NextResponse } from 'next/server'
import { isAuthenticated, revokeAllSessions } from '@/lib/auth'

// "Tüm cihazlardan çıkış yap": başka bir cihazda açık kalmış oturumları da kapatır
export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await revokeAllSessions()
  return NextResponse.json({ success: true })
}
