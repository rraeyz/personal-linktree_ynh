import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Mevcut ve yeni şifre gerekli' },
        { status: 400 }
      )
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Yeni şifre en az 8 karakter olmalı' },
        { status: 400 }
      )
    }

    // Admin kullanıcısını bul
    const admin = await prisma.admin.findFirst()

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    // Mevcut şifreyi kontrol et
    const isValid = await bcrypt.compare(currentPassword, admin.passwordHash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Mevcut şifre yanlış' },
        { status: 401 }
      )
    }

    // Yeni şifreyi hash'le ve güncelle
    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    await prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash: newPasswordHash },
    })

    return NextResponse.json({ message: 'Şifre başarıyla değiştirildi' })
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
