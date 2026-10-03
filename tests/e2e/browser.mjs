// Tarayıcı duman testi: ana sayfa (açık/koyu mod), mod geçişi ve admin panelinin tüm sekmeleri.
// api.test.mjs'den SONRA çalıştırılmalı (kurulu site ve ADMIN_PASSWORD gerekir).
// Kullanım: BASE_URL=http://localhost:3000 ADMIN_PASSWORD=... node tests/e2e/browser.mjs
import { chromium } from 'playwright'

const B = process.env.BASE_URL || 'http://localhost:3000'
const PASSWORD = process.env.ADMIN_PASSWORD || 'e2e-password-456'
const SHOTS = process.env.SCREENSHOT_DIR || ''
const problems = []

const browser = await chromium.launch()
const watch = (page, tag) => {
  page.on('pageerror', (e) => problems.push(`${tag} sayfa hatası: ${e.message}`))
  // Spotify gibi üçüncü taraf iframe'lerin kendi hataları (ör. CI'da ağ) uygulama hatası sayılmaz
  page.on('console', (m) => m.type() === 'error' && !m.location()?.url?.includes('spotify') && problems.push(`${tag} konsol: ${m.text()}`))
  page.on('response', (r) => r.status() >= 500 && problems.push(`${tag} ${r.status()} ${r.url()}`))
}

for (const mode of ['dark', 'light']) {
  const ctx = await browser.newContext({ viewport: { width: 420, height: 800 } })
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
  const page = await ctx.newPage()
  watch(page, 'mod geçişi')
  await page.goto(B + '/', { waitUntil: 'networkidle' })
  await page.click('button[aria-label="Toggle theme"]')
  if (!(await page.evaluate(() => document.documentElement.classList.contains('light')))) problems.push('toggle açık moda geçmedi')
  await ctx.close()
}

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
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
