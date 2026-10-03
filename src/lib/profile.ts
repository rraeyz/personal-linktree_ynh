// Profil tablosunda admin panelinden güncellenebilen alanlar.
// Gövdeyi doğrudan Prisma'ya vermek yerine sadece bunlar kabul edilir (id, createdAt vb. değiştirilemez).
export const PROFILE_EDITABLE_FIELDS = [
  'name', 'bio', 'imageUrl',
  'pageTitle', 'pageDescription', 'ogImageUrl', 'faviconUrl',
  'themePreset', 'primaryColor', 'accentColor', 'backgroundColor', 'cardColor', 'textColor',
  'buttonStyle', 'fontFamily', 'borderRadius', 'animationSpeed',
  'backgroundType', 'backgroundImage', 'backgroundOpacity',
  'contactEmail', 'contactPhone', 'contactAddress',
  'darkMode', 'verified', 'badges', 'analyticsRetentionDays',
  'smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword', 'smtpFrom', 'smtpFromName', 'smtpSecure',
  'companyName', 'companyAddress',
  'linkedinUrl', 'twitterUrl', 'discordUrl', 'youtubeUrl', 'instagramUrl', 'githubUrl',
] as const

// SMTP şifresi hiçbir zaman istemciye gönderilmez; sadece kayıtlı olup olmadığı bildirilir
export function toClientProfile<T extends { smtpPassword?: string } | null>(profile: T) {
  if (!profile) return profile
  const { smtpPassword, ...rest } = profile
  return { ...rest, smtpPassword: '', hasSmtpPassword: !!smtpPassword }
}
