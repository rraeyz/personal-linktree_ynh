import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getBaseUrl } from '@/lib/url'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl(headers())
  const profile = await prisma.profile.findFirst({ select: { updatedAt: true } }).catch(() => null)
  return [{ url: `${baseUrl}/`, lastModified: profile?.updatedAt ?? new Date(), changeFrequency: 'weekly', priority: 1 }]
}
