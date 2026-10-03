import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { getBaseUrl } from '@/lib/url'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl(headers())
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/setup', '/unsubscribe'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
