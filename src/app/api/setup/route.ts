import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated, isSetupComplete, setAuthCookie } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const USERNAME_PATTERN = /^[a-zA-Z0-9_.@-]{3,64}$/

export async function GET() {
  try {
    if (await isSetupComplete()) {
      return NextResponse.json({ setupRequired: false })
    }
    return NextResponse.json({ setupRequired: true, step: 'initial' })
  } catch (error) {
    return NextResponse.json({ setupRequired: true, step: 'initial' })
  }
}

// .env satırına güvenle yazılabilecek bir değer mi (tırnak / satır sonu enjeksiyonunu engeller)
function isEnvSafe(value: string): boolean {
  return !/["'`\\$\r\n]/.test(value)
}

export async function POST(request: NextRequest) {
  try {
    const { step, data = {} } = await request.json()
    const setupComplete = await isSetupComplete()

    if (step === 'initial') {
      // Kurulum bir kez yapılır; tamamlandıktan sonra admin bilgileri buradan değiştirilemez
      if (setupComplete) {
        return NextResponse.json(
          { success: false, error: 'Kurulum zaten tamamlanmış' },
          { status: 403 }
        )
      }

      const adminUsername = String(data.adminUsername || '').trim()
      const adminPassword = String(data.adminPassword || '')
      const baseUrl = String(data.baseUrl || '').trim()

      if (!USERNAME_PATTERN.test(adminUsername)) {
        return NextResponse.json(
          { success: false, error: 'Kullanıcı adı 3-64 karakter olmalı ve yalnızca harf, rakam, _ . @ - içermelidir' },
          { status: 400 }
        )
      }

      if (adminPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: 'Şifre en az 8 karakter olmalıdır' },
          { status: 400 }
        )
      }

      let safeBaseUrl = ''
      if (baseUrl) {
        try {
          const parsed = new URL(baseUrl)
          if (['http:', 'https:'].includes(parsed.protocol) && isEnvSafe(baseUrl)) {
            safeBaseUrl = baseUrl
          }
        } catch {
          // Geçersiz URL yok sayılır
        }
      }

      const jwtSecret = crypto.randomBytes(32).toString('base64')

      // Şifre .env'e düz metin olarak YAZILMAZ; Admin tablosunda bcrypt hash olarak tutulur
      const envContent = `# Database
DATABASE_URL="file:./prisma/dev.db"

# Security
JWT_SECRET="${jwtSecret}"
ADMIN_USERNAME="${adminUsername}"

# Application
NEXT_PUBLIC_BASE_URL="${safeBaseUrl}"
PORT=3000
NODE_ENV=production
`

      await prisma.admin.create({
        data: {
          id: 1,
          username: adminUsername,
          passwordHash: await bcrypt.hash(adminPassword, 12),
        },
      })

      const envPath = path.join(process.cwd(), '.env')
      try {
        fs.writeFileSync(envPath, envContent, { mode: 0o600 })
      } catch (error) {
        console.error('.env yazılamadı, JWT secret sadece bu oturum için geçerli:', error)
      }

      // Runtime'da hemen geçerli olsun (NEXT_PUBLIC_* build sırasında gömülür)
      process.env.JWT_SECRET = jwtSecret
      process.env.ADMIN_USERNAME = adminUsername
      delete process.env.ADMIN_PASSWORD

      // Kurulumu yapan kişi oturum açmış sayılır; sonraki adımlar bu oturumla korunur
      await setAuthCookie(adminUsername)

      return NextResponse.json({
        success: true,
        message: 'Environment configured',
        nextStep: 'database'
      })
    }

    // Kurulum tamamlandıysa sonraki adımlar yalnızca giriş yapmış admin içindir
    if (setupComplete && !(await isAuthenticated())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (step === 'database') {
      // Database tabloları build aşamasında template.db ile oluşturuldu
      // Burada sadece profil oluşturuyoruz
      try {
        const name = String(data.name || 'Your Name').slice(0, 200)
        const bio = String(data.bio || 'Welcome to my link tree!').slice(0, 2000)
        const pageTitle = String(data.pageTitle || 'Personal Link Tree').slice(0, 200)
        const pageDescription = String(data.pageDescription || 'My personal links').slice(0, 500)

        await prisma.profile.upsert({
          where: { id: 1 },
          update: { name, bio, pageTitle, pageDescription },
          create: {
            id: 1,
            name,
            bio,
            pageTitle,
            pageDescription,
            imageUrl: '/default-avatar.jpg',
          }
        })

        return NextResponse.json({
          success: true,
          message: 'Database initialized',
          nextStep: 'complete'
        })
      } catch (error) {
        console.error('Database setup error:', error)
        return NextResponse.json({
          success: false,
          error: 'Database initialization failed. Please ensure database is accessible.'
        }, { status: 500 })
      }
    }

    if (step === 'complete') {
      return NextResponse.json({
        success: true,
        message: 'Setup completed successfully!'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid step'
    }, { status: 400 })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Setup failed'
    }, { status: 500 })
  }
}
