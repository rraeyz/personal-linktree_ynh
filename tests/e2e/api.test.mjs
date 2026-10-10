// Uçtan uca API testleri: boş (kurulmamış) bir kuruluma karşı çalışır, kendi verisini oluşturur.
// Kullanım: BASE_URL=http://localhost:3000 node --test tests/e2e/api.test.mjs
// Ek bağımlılık yok (Node 20 yerleşik test aracı + fetch).
import { test } from 'node:test'
import assert from 'node:assert/strict'

const B = process.env.BASE_URL || 'http://localhost:3000'
const PASSWORD = 'e2e-password-123'
const NEW_PASSWORD = 'e2e-password-456'
// Rate limit IP başına; her test grubunda farklı IP ile birbirini etkilemesin
const ip = (n) => ({ 'x-real-ip': `203.0.113.${n}` })

// 1x1 PNG (yükleme testi için)
const PNG_1PX = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64')

async function req(path, { method = 'GET', body, cookie, headers = {}, json = true } = {}) {
  const init = { method, redirect: 'manual', headers: { ...headers } }
  if (cookie) init.headers.cookie = cookie
  if (body instanceof FormData) init.body = body
  else if (body !== undefined) {
    init.body = JSON.stringify(body)
    init.headers['content-type'] = 'application/json'
  }
  const res = await fetch(B + path, init)
  const text = await res.text()
  let data = text
  if (json) { try { data = JSON.parse(text) } catch {} }
  const setCookie = res.headers.get('set-cookie') || ''
  const token = setCookie.match(/auth-token=([^;]+)/)?.[1]
  return { status: res.status, data, text, headers: res.headers, cookie: token ? `auth-token=${token}` : undefined }
}

let admin // oturum cookie'si

test('kurulum sihirbazı', async () => {
  assert.deepEqual((await req('/api/setup')).data, { setupRequired: true, step: 'initial' })
  assert.equal((await req('/')).status, 307, 'kurulum yokken ana sayfa /setup\'a yönlenmeli')

  const initial = await req('/api/setup', { method: 'POST', body: { step: 'initial', data: { adminUsername: 'admin', adminPassword: PASSWORD, baseUrl: B } } })
  assert.equal(initial.status, 200)
  admin = initial.cookie
  assert.ok(admin, 'kurulum oturum açmalı')

  assert.equal((await req('/api/setup', { method: 'POST', cookie: admin, body: { step: 'database', data: { name: 'E2E Test', bio: 'bio' } } })).status, 200)
  assert.deepEqual((await req('/api/setup')).data, { setupRequired: false })
})

test('kurulum ikinci kez çalıştırılamaz', async () => {
  assert.equal((await req('/api/setup', { method: 'POST', body: { step: 'initial', data: { adminUsername: 'evil', adminPassword: 'hackedhacked' } } })).status, 403)
  assert.equal((await req('/api/setup', { method: 'POST', body: { step: 'database', data: { name: 'pwned' } } })).status, 401)
})

test('admin verileri girişsiz okunamaz/değiştirilemez', async () => {
  for (const path of ['/api/profile', '/api/links', '/api/subscribers', '/api/analytics', '/api/admin/overview', '/api/admin/export-settings']) {
    assert.equal((await req(path)).status, 401, path)
  }
  assert.equal((await req('/api/theme', { method: 'PUT', body: {} })).status, 401)
  assert.equal((await req('/api/profile/seo', { method: 'PUT', body: {} })).status, 401)
})

test('linkler: oluşturma, doğrulama, kısa link, şifre koruması', async () => {
  const bad = await req('/api/links', { method: 'POST', cookie: admin, body: { title: 'x', url: 'javascript:alert(1)' } })
  assert.equal(bad.status, 400, 'javascript: URL reddedilmeli')

  const pub = await req('/api/links', { method: 'POST', cookie: admin, body: { title: 'Örnek', url: 'https://example.com/', slug: 'ornek' } })
  assert.equal(pub.status, 200)
  const secret = await req('/api/links', { method: 'POST', cookie: admin, body: { title: 'Gizli', url: 'https://secret.example.com/', password: 'linkpw', slug: 'gizli' } })
  assert.equal(secret.status, 200)
  assert.match(secret.data.password, /^\$2[aby]\$/, 'link şifresi hash\'lenmeli')

  const home = await req('/', { json: false })
  assert.equal(home.status, 200)
  assert.ok(home.text.includes('Örnek'))
  assert.ok(!home.text.includes('secret.example.com'), 'şifreli linkin URL\'si sayfada olmamalı')

  const go = await req('/go/ornek', { headers: { 'user-agent': 'Mozilla/5.0 Chrome/128.0' } })
  assert.equal(go.status, 307)
  assert.equal(go.headers.get('location'), 'https://example.com/')
  assert.match((await req('/go/gizli')).headers.get('location') || '', /\/\?link=\d+$/)

  assert.equal((await req(`/api/links/${secret.data.id}/verify`, { method: 'POST', body: { password: 'yanlis' }, headers: ip(10) })).status, 401)
  const ok = await req(`/api/links/${secret.data.id}/verify`, { method: 'POST', body: { password: 'linkpw' }, headers: ip(10) })
  assert.equal(ok.data.url, 'https://secret.example.com/')

  // Düzenlemede mevcut hash geri gönderilince şifre bozulmamalı
  await req(`/api/links/${secret.data.id}`, { method: 'PUT', cookie: admin, body: { title: 'Gizli 2', password: secret.data.password } })
  assert.equal((await req(`/api/links/${secret.data.id}/verify`, { method: 'POST', body: { password: 'linkpw' }, headers: ip(11) })).status, 200)
})

test('SMTP şifresi istemciye gönderilmez', async () => {
  await req('/api/profile', { method: 'PUT', cookie: admin, body: { smtpHost: 'smtp.example.com', smtpPassword: 'cok-gizli' } })
  const profile = await req('/api/profile', { cookie: admin })
  assert.equal(profile.data.smtpPassword, '')
  assert.equal(profile.data.hasSmtpPassword, true)
  assert.ok(!(await req('/', { json: false })).text.includes('cok-gizli'))
})

test('görsel yükleme ve /media', async () => {
  const unauth = new FormData()
  unauth.append('kind', 'avatar'); unauth.append('file', new Blob([PNG_1PX], { type: 'image/png' }), 'a.png')
  assert.equal((await req('/api/admin/upload', { method: 'POST', body: unauth })).status, 401)

  const svg = new FormData()
  svg.append('kind', 'avatar'); svg.append('file', new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>'], { type: 'image/svg+xml' }), 'a.svg')
  assert.equal((await req('/api/admin/upload', { method: 'POST', cookie: admin, body: svg })).status, 400)

  const form = new FormData()
  form.append('kind', 'avatar'); form.append('file', new Blob([PNG_1PX], { type: 'image/png' }), 'a.png')
  const upload = await req('/api/admin/upload', { method: 'POST', cookie: admin, body: form })
  assert.equal(upload.status, 200, JSON.stringify(upload.data))
  assert.match(upload.data.url, /^\/media\/avatar-[0-9a-f-]{36}\.webp$/)

  const media = await req(upload.data.url, { json: false })
  assert.equal(media.status, 200)
  assert.equal(media.headers.get('content-type'), 'image/webp')
  assert.equal((await req('/media/..%2Fprisma%2Fdev.db')).status, 404)
})

test('güvenlik başlıkları, CSRF ve kapalı görsel proxy', async () => {
  const home = await req('/', { json: false })
  assert.equal(home.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(home.headers.get('x-frame-options'), 'SAMEORIGIN')
  assert.equal(home.headers.get('x-powered-by'), null)
  assert.equal((await req('/api/auth/login', { method: 'POST', headers: { origin: 'https://evil.example', ...ip(20) }, body: { username: 'admin', password: 'x' } })).status, 403)
  assert.equal((await req('/_next/image?url=https%3A%2F%2Fexample.com%2Fa.png&w=64&q=75')).status, 404)
})

test('herkese açık uç noktalar', async () => {
  assert.equal((await req('/api/health')).status, 200)
  assert.equal((await req('/robots.txt', { json: false })).status, 200)
  assert.equal((await req('/sitemap.xml', { json: false })).status, 200)
  assert.equal((await req('/api/vcard')).status, 404, 'vCard varsayılan kapalı')
  assert.equal((await req('/api/subscribe', { method: 'POST', body: { email: 'okur@example.com' }, headers: ip(30) })).data.success, true)
  assert.equal((await req('/api/unsubscribe?e=okur%40example.com&t=yanlis', { method: 'POST' })).status, 400)
  assert.deepEqual((await req('/api/views', { method: 'POST', body: {}, headers: { 'user-agent': 'curl/8' } })).data, { recorded: false })
})

test('admin genel bakış özeti', async () => {
  const browserUA = { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36', ...ip(60) }
  assert.deepEqual((await req('/api/views', { method: 'POST', body: {}, headers: browserUA })).data, { recorded: true })
  const future = new Date(Date.now() + 3 * 86400e3).toISOString()
  assert.equal((await req('/api/links', { method: 'POST', cookie: admin, body: { title: 'Yakında', url: 'https://example.com/soon', startDate: future } })).status, 200)

  const week = await req('/api/admin/overview', { cookie: admin })
  assert.equal(week.status, 200)
  assert.equal(week.data.range, 7)
  assert.equal(week.data.days.length, 7)
  assert.ok(week.data.kpis.views.value >= 1, 'görüntülenme sayılmalı')
  assert.ok(week.data.kpis.visitors.value >= 1)
  assert.equal(week.data.kpis.views.series.length, 7)
  assert.equal(week.data.kpis.views.series.reduce((a, b) => a + b, 0), week.data.kpis.views.value, 'seri toplamı değere eşit olmalı')
  assert.ok(week.data.kpis.subscribers.total >= 1, 'abone sayılmalı')
  assert.ok(week.data.status.upcoming >= 1)
  assert.equal(week.data.status.nextUpcoming.title, 'Yakında')
  assert.equal(typeof week.data.status.smtpConfigured, 'boolean')
  assert.match(week.data.status.version, /^\d+\.\d+\.\d+/)
  assert.ok(Array.isArray(week.data.topLinks))

  const month = await req('/api/admin/overview?range=30d', { cookie: admin })
  assert.equal(month.data.range, 30)
  assert.equal(month.data.kpis.clicks.series.length, 30)
})

test('blok tipleri, düzen ve öne çıkan link', async () => {
  const thumbForm = new FormData()
  thumbForm.append('kind', 'thumb'); thumbForm.append('file', new Blob([PNG_1PX], { type: 'image/png' }), 't.png')
  const thumb = (await req('/api/admin/upload', { method: 'POST', cookie: admin, body: thumbForm })).data.url
  assert.match(thumb, /^\/media\/thumb-/)

  const create = (body) => req('/api/links', { method: 'POST', cookie: admin, body })
  assert.equal((await create({ type: 'text', title: 'Hakkımda', description: 'Merhaba dünya' })).status, 200, 'metin bloğu URL istemez')
  assert.equal((await create({ type: 'gallery', title: 'Galeri', images: [thumb] })).status, 200)
  assert.equal((await create({ type: 'spotify', title: 'Liste', url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M' })).status, 200)
  assert.equal((await create({ type: 'countdown', title: 'Etkinlik', targetDate: new Date(Date.now() + 86400e3).toISOString() })).status, 200)
  assert.equal((await create({ type: 'portfolio', title: 'Proje Kartı', description: 'Açıklama', thumbnail: thumb })).status, 200)
  assert.equal((await create({ type: 'link', title: 'Öne Çıkan', url: 'https://example.com/one', featured: true, thumbnail: thumb })).status, 200)

  assert.equal((await create({ type: 'spotify', title: 'x', url: 'https://example.com/x' })).status, 400, 'Spotify olmayan adres reddedilmeli')
  assert.equal((await create({ type: 'gallery', title: 'x', images: ['javascript:alert(1)'] })).status, 400)
  assert.equal((await create({ type: 'bilinmeyen', title: 'x', url: 'https://a.com' })).status, 400)

  let home = (await req('/', { json: false })).text
  for (const text of ['Merhaba dünya', 'open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M', 'Proje Kartı', 'featured-card']) {
    assert.ok(home.includes(text), `ana sayfada olmalı: ${text}`)
  }

  assert.equal((await req('/api/theme', { method: 'PUT', cookie: admin, body: { layout: 'grid' } })).status, 200)
  home = (await req('/', { json: false })).text
  assert.ok(home.includes('grid grid-cols-2'), 'ızgara düzeni uygulanmalı')
})

test('ziyaretçi sayfası: profil kartı, dinamik bloklar ve sıra', async () => {
  const put = (body) => req('/api/profile', { method: 'PUT', cookie: admin, body })
  assert.equal((await put({ timezone: 'Mars/Olympus' })).status, 400, 'geçersiz saat dilimi reddedilmeli')
  assert.equal((await put({ statusText: 'Tez yazıyor', location: 'İstanbul', timezone: 'Europe/Istanbul', showNewsletter: false, showShareButton: false })).status, 200)
  let home = (await req('/', { json: false })).text
  assert.ok(home.includes('Tez yazıyor') && home.includes('İstanbul'), 'durum ve konum görünmeli')
  assert.ok(!home.includes('newsletter-email'), 'bülten kapalıyken kutu olmamalı')
  // SMTP yarım (şifre/kullanıcı yok) olduğu için "Bana yaz" gizli kalmalı
  assert.ok(!home.includes('Bana yaz'), 'SMTP eksikken Bana yaz görünmemeli')

  assert.equal((await put({ statusText: '', location: '', showNewsletter: true })).status, 200)
  home = (await req('/', { json: false })).text
  assert.ok(!home.includes('Tez yazıyor'), 'boş durum görünmemeli')
  assert.ok(home.includes('newsletter-email'), 'bülten açıkken kutu olmalı')

  // İçi boş blok (görselsiz galeri) sayfada yer kaplamaz (blok sarmalayıcı sayısı değişmemeli)
  const blockCount = (html) => (html.match(/data-cat="/g) || []).length
  const before = blockCount(home)
  const empty = await req('/api/links', { method: 'POST', cookie: admin, body: { type: 'gallery', title: 'Boş galeri', images: [] } })
  assert.equal(empty.status, 200)
  home = (await req('/', { json: false })).text
  assert.equal(blockCount(home), before, 'boş galeri çizilmemeli')
  assert.ok(!home.includes('Boş galeri'))

  // Sıra: metin bloğunu en üste al, sayfada linklerden önce gelmeli
  const links = (await req('/api/links', { cookie: admin })).data
  const about = links.find((l) => l.title === 'Hakkımda')
  const featured = links.find((l) => l.title === 'Öne Çıkan')
  assert.ok(about && featured)
  const reordered = [about, ...links.filter((l) => l.id !== about.id)]
  for (const [index, link] of reordered.entries()) {
    assert.equal((await req(`/api/links/${link.id}`, { method: 'PUT', cookie: admin, body: { order: index } })).status, 200)
  }
  home = (await req('/', { json: false })).text
  assert.ok(home.indexOf('Merhaba dünya') < home.indexOf('Öne Çıkan'), 'Hakkımda en üste taşınmalı')
  await req(`/api/links/${empty.data.id}`, { method: 'DELETE', cookie: admin })
})

test('link önizleme: yetki ve SSRF koruması', async () => {
  assert.equal((await req('/api/admin/link-preview', { method: 'POST', body: { url: 'https://example.com' } })).status, 401)
  for (const url of ['http://127.0.0.1:3000/', 'http://localhost/', 'http://169.254.169.254/latest/meta-data/', 'http://[::1]/', 'file:///etc/passwd']) {
    const res = await req('/api/admin/link-preview', { method: 'POST', cookie: admin, body: { url } })
    assert.equal(res.status, 400, `${url} reddedilmeli`)
  }
})

test('giriş rate limit: sadece hatalı denemeler sayılır', async () => {
  for (let i = 0; i < 12; i++) {
    assert.equal((await req('/api/auth/login', { method: 'POST', headers: ip(40), body: { username: 'admin', password: PASSWORD } })).status, 200)
  }
  const codes = []
  for (let i = 0; i < 11; i++) {
    codes.push((await req('/api/auth/login', { method: 'POST', headers: ip(41), body: { username: 'admin', password: 'yanlis' } })).status)
  }
  assert.deepEqual(codes, [...Array(10).fill(401), 429])
})

test('şifre değişince tüm oturumlar kapanır', async () => {
  const other = (await req('/api/auth/login', { method: 'POST', headers: ip(50), body: { username: 'admin', password: PASSWORD } })).cookie
  assert.equal((await req('/api/profile', { cookie: other })).status, 200)

  const change = await req('/api/admin/change-password', { method: 'POST', cookie: admin, body: { currentPassword: PASSWORD, newPassword: NEW_PASSWORD } })
  assert.equal(change.status, 200)
  assert.equal((await req('/api/profile', { cookie: admin })).status, 401)
  assert.equal((await req('/api/profile', { cookie: other })).status, 401)
  assert.equal((await req('/api/auth/login', { method: 'POST', headers: ip(51), body: { username: 'admin', password: PASSWORD } })).status, 401)
  assert.equal((await req('/api/auth/login', { method: 'POST', headers: ip(51), body: { username: 'admin', password: NEW_PASSWORD } })).status, 200)
})
