import { NextRequest, NextResponse } from 'next/server'
import { isSetupComplete, setAuthCookie, verifyAdminCredentials } from '@/lib/auth'
import { getClientIp, isRateLimited, isRateLimitExceeded } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    // Brute-force koruması: IP başına 15 dakikada 10 HATALI deneme (başarılı girişler sayılmaz)
    const rateKey = `login:${getClientIp(request.headers)}`
    if (isRateLimitExceeded(rateKey, 10)) {
      return NextResponse.json(
        { error: 'Çok fazla deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.' },
        { status: 429 }
      )
    }

    const { username, password } = await request.json()

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return NextResponse.json(
        { error: 'Kullanıcı adı ve şifre gerekli' },
        { status: 400 }
      )
    }

    if (!(await isSetupComplete())) {
      return NextResponse.json(
        { error: 'Sistem ayarları eksik. Lütfen setup yapın.' },
        { status: 500 }
      )
    }

    if (!(await verifyAdminCredentials(username, password))) {
      isRateLimited(rateKey, 10, 15 * 60 * 1000)
      return NextResponse.json(
        { error: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      )
    }

    await setAuthCookie(username)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}
