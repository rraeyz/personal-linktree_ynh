// Tarayıcı duman testi: ana sayfa (açık/koyu mod), mod geçişi ve admin panelinin tüm sekmeleri.
// api.test.mjs'den SONRA çalıştırılmalı (kurulu site ve ADMIN_PASSWORD gerekir).
// Kullanım: BASE_URL=http://localhost:3000 ADMIN_PASSWORD=... node tests/e2e/browser.mjs
import { chromium } from 'playwright'

const B = process.env.BASE_URL || 'http://localhost:3000'
const PASSWORD = process.env.ADMIN_PASSWORD || 'e2e-password-456'
const SHOTS = process.env.SCREENSHOT_DIR || ''
const problems = []

const browser = await chromium.launch()

// Üçüncü taraf gömmeler (Spotify, YouTube, X, Instagram) testte yüklenmez: kendi iframe'lerindeki
// hatalar (ör. Spotify oynatıcısının kendi React hataları) Playwright'ta sayfa hatası olarak görünüp
// testi ağ durumuna bağımlı yapıyordu. Böylece test sadece bu uygulamanın kodunu ölçer.
const THIRD_PARTY = /(^|\.)(spotify\.com|scdn\.co|youtube\.com|ytimg\.com|twitter\.com|x\.com|twimg\.com|instagram\.com|cdninstagram\.com)$/
const blockThirdParty = (context) =>
  context.route((url) => THIRD_PARTY.test(url.hostname), (route) => route.abort())
const watch = (page, tag) => {
  page.on('pageerror', (e) => problems.push(`${tag} sayfa hatası: ${e.message} @ ${(e.stack || '').split('\n').slice(1, 3).join(' | ')}`))
  // Spotify gibi üçüncü taraf iframe'lerin kendi hataları (ör. CI'da ağ) uygulama hatası sayılmaz
  page.on('console', (m) => m.type() === 'error' && !m.location()?.url?.includes('spotify') && problems.push(`${tag} konsol: ${m.text()}`))
  page.on('response', (r) => r.status() >= 500 && problems.push(`${tag} ${r.status()} ${r.url()}`))
}

for (const mode of ['dark', 'light']) {
  const ctx = await browser.newContext({ viewport: { width: 420, height: 800 } })
  await blockThirdParty(ctx)
  // Sadece ana çerçevede (iframe'lerde, ör. Spotify, localStorage erişimi olmayabilir)
  await ctx.addInitScript((m) => {
    try { if (window === window.top) localStorage.setItem('theme', m) } catch {}
  }, mode)
  const page = await ctx.newPage()
  watch(page, `ana sayfa (${mode})`)
  await page.goto(B + '/', { waitUntil: 'networkidle' })
  const isLight = await page.evaluate(() => document.documentElement.classList.contains('light'))
  if (isLight !== (mode === 'light')) problems.push(`${mode} modu uygulanmadı`)
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/home-${mode}.png` })
  await ctx.close()
}

{
  const ctx = await browser.newContext({ colorScheme: 'dark' })
  await blockThirdParty(ctx)
  const page = await ctx.newPage()
  watch(page, 'mod geçişi')
  await page.goto(B + '/', { waitUntil: 'networkidle' })
  await page.click('button[aria-label="Toggle theme"]')
  if (!(await page.evaluate(() => document.documentElement.classList.contains('light')))) problems.push('toggle açık moda geçmedi')
  await ctx.close()
}

{
  const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await blockThirdParty(adminContext)
  const page = await adminContext.newPage()
  watch(page, 'admin')
  await page.goto(B + '/admin/login', { waitUntil: 'networkidle' })
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', PASSWORD)
  await Promise.all([page.waitForURL('**/admin/dashboard', { timeout: 15000 }), page.click('button[type="submit"]')])
  // Canlı önizleme açılmalı ve siteyi göstermeli
  await page.getByRole('button', { name: 'Önizleme' }).click()
  await page.frameLocator('iframe[title="Site önizlemesi"]').locator('h1').first().waitFor({ timeout: 15000 })

  for (const tab of ['Profil Ayarları', 'Link Yönetimi', 'Analytics', 'Aboneler', 'Özel E-posta', 'QR Kod', 'Tema', 'Ayarlar']) {
    await page.getByRole('button', { name: tab, exact: true }).click()
    await page.waitForTimeout(700)
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/admin-${tab.replace(/\s/g, '_')}.png` })
  }
}

await browser.close()
if (problems.length) {
  console.error('Tarayıcı testinde sorunlar:\n' + problems.join('\n'))
  process.exit(1)
}
console.log('Tarayıcı testi başarılı')
