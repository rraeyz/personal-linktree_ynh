import { UAParser } from 'ua-parser-js'
import { prisma } from '@/lib/prisma'
import { getClientIp, hashIp, isPrivateIp } from '@/lib/security'

// geoip-lite opsiyonel (build ortamında olmayabilir)
let geoip: any = null
try {
  geoip = require('geoip-lite')
} catch (error) {
  console.log('GeoIP not available, will use default location data')
}

export type UtmParams = {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
}

const UTM_KEYS: Array<[keyof UtmParams, string]> = [
  ['utmSource', 'utm_source'],
  ['utmMedium', 'utm_medium'],
  ['utmCampaign', 'utm_campaign'],
  ['utmTerm', 'utm_term'],
  ['utmContent', 'utm_content'],
]

export function utmFromSearchParams(params: URLSearchParams | Record<string, string | string[] | undefined>): UtmParams {
  const get = (key: string) => {
    const value = params instanceof URLSearchParams ? params.get(key) : params[key]
    return (Array.isArray(value) ? value[0] : value) || ''
  }
  const utm: UtmParams = {}
  for (const [field, key] of UTM_KEYS) utm[field] = get(key).slice(0, 200)
  return utm
}

// Bir link tıklamasını kaydeder: tıklama sayacı + detaylı analytics satırı
export async function recordClick(
  linkId: number,
  headers: Headers,
  extra: { referrer?: string; utm?: UtmParams } = {}
) {
  const userAgent = (headers.get('user-agent') || '').slice(0, 500)
  const result = new UAParser(userAgent).getResult()

  const ip = getClientIp(headers)
  let country = 'Unknown'
  let city = ''
  let region = ''

  if (isPrivateIp(ip)) {
    country = 'Local'
  } else if (geoip) {
    const geo = geoip.lookup(ip)
    if (geo) {
      country = geo.country || 'Unknown'
      city = geo.city || ''
      region = geo.region || ''
    }
  }

  const link = await prisma.link.update({
    where: { id: linkId },
    data: { clicks: { increment: 1 } },
  })

  await prisma.analytics.create({
    data: {
      linkId,
      userAgent,
      device: result.device.type || 'desktop',
      browser: result.browser.name || 'Unknown',
      os: result.os.name || 'Unknown',
      country,
      city,
      region,
      referrer: (extra.referrer ?? headers.get('referer') ?? '').slice(0, 500),
      utmSource: extra.utm?.utmSource || '',
      utmMedium: extra.utm?.utmMedium || '',
      utmCampaign: extra.utm?.utmCampaign || '',
      utmTerm: extra.utm?.utmTerm || '',
      utmContent: extra.utm?.utmContent || '',
      ipHash: hashIp(ip),
    },
  })

  return link
}
