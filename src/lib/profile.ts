// Profil tablosunda admin panelinden güncellenebilen alanlar.
// Gövdeyi doğrudan Prisma'ya vermek yerine sadece bunlar kabul edilir (id, createdAt vb. değiştirilemez).
export const PROFILE_EDITABLE_FIELDS = [
  'name', 'bio', 'imageUrl',
  'pageTitle', 'pageDescription', 'ogImageUrl', 'faviconUrl',
  'themePreset', 'primaryColor', 'accentColor', 'backgroundColor', 'cardColor', 'textColor',
  'buttonStyle', 'fontFamily', 'borderRadius', 'animationSpeed',
  'backgroundType', 'backgroundImage', 'backgroundOpacity', 'coverImage', 'layout',
  'contactEmail', 'contactPhone', 'contactAddress', 'showVCard',
  'darkMode', 'verified', 'badges', 'analyticsRetentionDays',
  'smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword', 'smtpFrom', 'smtpFromName', 'smtpSecure',
  'companyName', 'companyAddress',
  'linkedinUrl', 'twitterUrl', 'discordUrl', 'youtubeUrl', 'instagramUrl', 'githubUrl', 'showSocialIcons',
  'statusText', 'location', 'timezone',
  'showContactButton', 'showShareButton', 'showNewsletter', 'showCategoryTabs',
] as const

const PROFILE_CARD_BOOLEANS = ['showContactButton', 'showShareButton', 'showNewsletter', 'showCategoryTabs'] as const

// Geçerli bir IANA saat dilimi mi (Europe/Istanbul gibi)? Boş değer "saat gösterme" demektir.
export function isValidTimezone(value: string): boolean {
  if (!value) return true
  try {
    new Intl.DateTimeFormat('en', { timeZone: value })
    return true
  } catch {
    return false
  }
}

// Profil kartı alanlarını doğrular/normalleştirir. Hatalıysa { error } döner.
export function normalizeProfileCard(data: Record<string, any>): { error: string } | null {
  if (data.statusText !== undefined) data.statusText = String(data.statusText ?? '').trim().slice(0, 120)
  if (data.location !== undefined) data.location = String(data.location ?? '').trim().slice(0, 80)
  if (data.timezone !== undefined) {
    data.timezone = String(data.timezone ?? '').trim()
    if (!isValidTimezone(data.timezone)) return { error: 'Geçersiz saat dilimi (örnek: Europe/Istanbul)' }
  }
  for (const key of PROFILE_CARD_BOOLEANS) {
    if (data[key] !== undefined) data[key] = data[key] === true || data[key] === 'true'
  }
  return null
}

// SMTP şifresi hiçbir zaman istemciye gönderilmez; sadece kayıtlı olup olmadığı bildirilir
export function toClientProfile<T extends { smtpPassword?: string } | null>(profile: T) {
  if (!profile) return profile
  const { smtpPassword, ...rest } = profile
  return { ...rest, smtpPassword: '', hasSmtpPassword: !!smtpPassword }
}
