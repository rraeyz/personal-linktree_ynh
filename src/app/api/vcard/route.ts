import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBaseUrl, toAbsoluteUrl } from '@/lib/url'

export const dynamic = 'force-dynamic'

// vCard 3.0 değerlerinde virgül, noktalı virgül, ters bölü ve satır sonu kaçışlanmalı
const esc = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '').replace(/,/g, '\\,').replace(/;/g, '\\;')

// "Rehbere Ekle": profil bilgilerinden kişi kartı. Sadece admin panelinden açıldıysa çalışır.
export async function GET(request: NextRequest) {
  const profile = await prisma.profile.findFirst()
  if (!profile || !profile.showVCard) {
    return new Response('Not found', { status: 404 })
  }

  const baseUrl = getBaseUrl(request.headers)
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${esc(profile.name)}`,
    `N:${esc(profile.name)};;;;`,
  ]
  if (profile.companyName) lines.push(`ORG:${esc(profile.companyName)}`)
  if (profile.contactEmail) lines.push(`EMAIL;TYPE=INTERNET:${esc(profile.contactEmail)}`)
  if (profile.contactPhone) lines.push(`TEL;TYPE=CELL:${esc(profile.contactPhone)}`)
  if (profile.contactAddress) lines.push(`ADR;TYPE=HOME:;;${esc(profile.contactAddress)};;;;`)
  lines.push(`URL:${esc(baseUrl + '/')}`)
  if (profile.bio) lines.push(`NOTE:${esc(profile.bio.slice(0, 500))}`)
  const photo = toAbsoluteUrl(profile.imageUrl, baseUrl)
  if (photo && !photo.startsWith('data:')) lines.push(`PHOTO;VALUE=URI:${photo}`)
  lines.push('END:VCARD')

  const fileName = (profile.name || 'kisi').replace(/[^a-zA-Z0-9ğüşöçıİĞÜŞÖÇ _-]/g, '').trim() || 'kisi'

  return new Response(lines.join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="contact.vcf"; filename*=UTF-8''${encodeURIComponent(fileName)}.vcf`,
      'Cache-Control': 'no-store',
    },
  })
}
