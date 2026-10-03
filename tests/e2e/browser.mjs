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
  page.on('console', (m) => m.type() === 'error' && problems.push(`${tag} konsol: ${m.text()}`))
  page.on('response', (r) => r.status() >= 500 && problems.push(`${tag} ${r.status()} ${r.url()}`))
}

for (const mode of ['dark', 'light']) {
  const ctx = await browser.newContext({ viewport: { width: 420, height: 800 } })
  await ctx.addInitScript((m) => localStorage.setItem('theme', m), mode)
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
