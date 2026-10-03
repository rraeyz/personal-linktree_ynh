import http from 'http'
import https from 'https'
import dns from 'dns'
import net from 'net'
import type { LookupFunction } from 'net'
import { saveUploadedImage, UploadError } from '@/lib/uploads'

// Bir linkin önizleme görselini (og:image) otomatik çeker.
// Sunucu admin'in girdiği adrese istek attığı için SSRF'e karşı korunur: bağlanılan IP adresi
// (DNS çözümlemesinden SONRA, bağlantı anında) özel/yerel ağdaysa istek reddedilir; yönlendirmelerin
// her adımı yeniden denetlenir; süre ve boyut sınırı vardır.

const TIMEOUT_MS = 8000
const MAX_HTML_BYTES = 1024 * 1024
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_REDIRECTS = 3

export class PreviewError extends Error {}

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, part) => (acc << 8) + parseInt(part, 10), 0) >>> 0
}

const PRIVATE_V4: Array<[string, number]> = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
]

export function isPublicAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const value = ipv4ToInt(ip)
    return !PRIVATE_V4.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
      return (value & mask) === (ipv4ToInt(base) & mask)
    })
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase()
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPublicAddress(mapped[1])
    if (lower === '::' || lower === '::1') return false
    if (/^f[cd]/.test(lower)) return false // fc00::/7 özel
    if (/^fe[89ab]/.test(lower)) return false // fe80::/10 link-local
    if (/^ff/.test(lower)) return false // multicast
    return true
  }
  return false
}

const safeLookup: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { all: true }, (error, addresses) => {
    if (error) return (callback as any)(error)
    const list = addresses as dns.LookupAddress[]
    const blocked = list.find((a) => !isPublicAddress(a.address))
    if (blocked) {
      return (callback as any)(new PreviewError('Bu adres özel/yerel bir ağa çıkıyor, izin verilmiyor'))
    }
    if ((options as any)?.all) return (callback as any)(null, list)
    return (callback as any)(null, list[0].address, list[0].family)
  })
}

function fetchSafe(rawUrl: string, maxBytes: number, redirects = 0): Promise<{ body: Buffer; contentType: string; finalUrl: string }> {
  return new Promise((resolve, reject) => {
    let url: URL
    try {
      url = new URL(rawUrl)
    } catch {
      return reject(new PreviewError('Geçersiz adres'))
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return reject(new PreviewError('Sadece http(s) adresleri desteklenir'))
    }
    // IP adresiyle yazılmış hostlarda DNS çözümlemesi yapılmaz; doğrudan kontrol et
    const host = url.hostname.replace(/^\[|\]$/g, '')
    if (net.isIP(host) && !isPublicAddress(host)) {
      return reject(new PreviewError('Bu adres özel/yerel bir ağa çıkıyor, izin verilmiyor'))
    }

    const client = url.protocol === 'https:' ? https : http
    const request = client.get(url, {
      lookup: safeLookup,
      timeout: TIMEOUT_MS,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; LinktreePreviewBot/1.0)',
        accept: 'text/html,application/xhtml+xml,image/*;q=0.9,*/*;q=0.5',
      },
    }, (response) => {
      const status = response.statusCode || 0
      if (status >= 300 && status < 400 && response.headers.location) {
        response.resume()
        if (redirects >= MAX_REDIRECTS) return reject(new PreviewError('Çok fazla yönlendirme'))
        const next = new URL(response.headers.location, url).toString()
        return fetchSafe(next, maxBytes, redirects + 1).then(resolve, reject)
      }
      if (status < 200 || status >= 300) {
        response.resume()
        return reject(new PreviewError(`Sayfa yanıt vermedi (HTTP ${status})`))
      }
      const declared = parseInt(String(response.headers['content-length'] || '0'))
      if (declared > maxBytes) {
        response.destroy()
        return reject(new PreviewError('Dosya çok büyük'))
      }
      const chunks: Buffer[] = []
      let size = 0
      response.on('data', (chunk: Buffer) => {
        size += chunk.length
        if (size > maxBytes) {
          response.destroy()
          reject(new PreviewError('Dosya çok büyük'))
          return
        }
        chunks.push(chunk)
      })
      response.on('end', () => resolve({
        body: Buffer.concat(chunks),
        contentType: String(response.headers['content-type'] || ''),
        finalUrl: url.toString(),
      }))
      response.on('error', reject)
    })
    request.on('timeout', () => request.destroy(new PreviewError('Sayfa zamanında yanıt vermedi')))
    request.on('error', (error) => reject(error instanceof PreviewError ? error : new PreviewError('Sayfaya bağlanılamadı')))
  })
}

const decodeEntities = (value: string) =>
  value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')

// HTML içinden og:image / twitter:image / image_src adresini bulur
export function extractPreviewImage(html: string, pageUrl: string): string | null {
  const head = html.slice(0, 300_000)
  const metaTags = head.match(/<meta\b[^>]*>/gi) || []
  const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1]

  const candidates: string[] = []
  for (const key of ['og:image:secure_url', 'og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']) {
    for (const tag of metaTags) {
      const name = (attr(tag, 'property') || attr(tag, 'name') || '').toLowerCase()
      const content = attr(tag, 'content')
      if (name === key && content) candidates.push(content)
    }
  }
  const linkTag = head.match(/<link\b[^>]*rel\s*=\s*["']image_src["'][^>]*>/i)?.[0]
  const linkHref = linkTag && attr(linkTag, 'href')
  if (linkHref) candidates.push(linkHref)

  for (const candidate of candidates) {
    try {
      const resolved = new URL(decodeEntities(candidate.trim()), pageUrl)
      if (resolved.protocol === 'http:' || resolved.protocol === 'https:') return resolved.toString()
    } catch {
      // geçersiz aday, sonrakine bak
    }
  }
  return null
}

// Sayfayı çeker, önizleme görselini bulur, indirip /media altına kaydeder
export async function fetchLinkPreviewImage(pageUrl: string): Promise<string> {
  const page = await fetchSafe(pageUrl, MAX_HTML_BYTES)

  let imageUrl: string | null
  if (page.contentType.startsWith('image/')) {
    imageUrl = page.finalUrl // link doğrudan bir görsel
  } else {
    imageUrl = extractPreviewImage(page.body.toString('utf8'), page.finalUrl)
  }
  if (!imageUrl) throw new PreviewError('Bu sayfada önizleme görseli (og:image) bulunamadı')

  const image = imageUrl === page.finalUrl ? page : await fetchSafe(imageUrl, MAX_IMAGE_BYTES)
  try {
    return await saveUploadedImage(image.body, 'thumb')
  } catch (error) {
    if (error instanceof UploadError) throw new PreviewError(`Önizleme görseli kullanılamadı: ${error.message}`)
    throw error
  }
}
