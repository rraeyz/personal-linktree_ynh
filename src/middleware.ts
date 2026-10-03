import { NextRequest, NextResponse } from 'next/server'

// CSRF'e karşı ek katman: veri değiştiren API isteklerinde Origin başka bir siteyse reddet.
// (Cookie zaten SameSite=lax; Origin göndermeyen istemciler — curl, sunucu — etkilenmez.)
export function middleware(request: NextRequest) {
  const method = request.method
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return NextResponse.next()
  }

  const origin = request.headers.get('origin')
  if (!origin) return NextResponse.next()

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  let originHost = ''
  try {
    originHost = new URL(origin).host
  } catch {
    // Geçersiz Origin
  }

  if (!host || originHost !== host) {
    // Nginx X-Forwarded-Host'u $server_name ile set ediyor; Host başlığıyla da eşleşebilir
    const plainHost = request.headers.get('host')
    if (!plainHost || originHost !== plainHost) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
