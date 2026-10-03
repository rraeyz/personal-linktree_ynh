// Sitenin dış adresi (https://alanadi.com). Build sırasında koda gömülen
// NEXT_PUBLIC_* değişkenleri yerine her istekte nginx'in ilettiği başlıklardan hesaplanır.
export function getBaseUrl(headers: Headers): string {
  const host = headers.get('x-forwarded-host')?.split(',')[0].trim() || headers.get('host') || 'localhost:3000'
  const proto = headers.get('x-forwarded-proto')?.split(',')[0].trim() || 'http'
  return `${proto}://${host}`
}

// Göreli yolu (/media/x.webp) tam adrese çevirir; zaten tam adresse veya data: ise dokunmaz
export function toAbsoluteUrl(url: string, baseUrl: string): string {
  if (!url || /^(https?:|data:)/i.test(url)) return url
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}
