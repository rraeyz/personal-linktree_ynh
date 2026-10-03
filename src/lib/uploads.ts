import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import sharp from 'sharp'

// Docker'da /app/public/uploads kalıcı volume olarak bağlı (YunoHost: $data_dir/uploads).
// Next.js build sonrası public/'e eklenen dosyaları servis etmediği için dosyalar /media/<ad> route'u ile sunulur.
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads')

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB (yükleme sonrası zaten küçültülüyor)

type UploadKind = 'avatar' | 'favicon' | 'og' | 'background' | 'icon'

const PRESETS: Record<UploadKind, { process: (img: sharp.Sharp) => sharp.Sharp; ext: 'webp' | 'png' | 'jpg' }> = {
  // Profil fotoğrafı: kare, 512px
  avatar: { process: (img) => img.resize(512, 512, { fit: 'cover' }).webp({ quality: 85 }), ext: 'webp' },
  // Tarayıcı sekme ikonu: 64px PNG (her tarayıcı destekler)
  favicon: { process: (img) => img.resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png(), ext: 'png' },
  // Sosyal medya önizlemesi: 1200x630 JPEG (Facebook/Twitter/WhatsApp en iyi bunu destekler)
  og: { process: (img) => img.resize(1200, 630, { fit: 'cover' }).flatten({ background: '#ffffff' }).jpeg({ quality: 85 }), ext: 'jpg' },
  // Sayfa arka planı: en fazla 1920px genişlik
  background: { process: (img) => img.resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }), ext: 'webp' },
  // Özel link ikonu: 128px PNG
  icon: { process: (img) => img.resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png(), ext: 'png' },
}

export function isUploadKind(value: unknown): value is UploadKind {
  return typeof value === 'string' && value in PRESETS
}

const ALLOWED_INPUT_FORMATS = new Set(['jpeg', 'png', 'webp', 'gif', 'avif', 'heif', 'tiff'])

// Görseli doğrular, yeniden kodlar (EXIF/konum bilgisi silinir) ve kaydeder. Herkese açık yolu döner.
export async function saveUploadedImage(buffer: Buffer, kind: UploadKind): Promise<string> {
  let metadata: sharp.Metadata
  try {
    metadata = await sharp(buffer).metadata()
  } catch {
    throw new UploadError('Dosya bir görsel olarak okunamadı')
  }

  // SVG kabul edilmez (içinde script olabilir); diğer formatlar raster'a dönüştürülür
  if (!metadata.format || !ALLOWED_INPUT_FORMATS.has(metadata.format)) {
    throw new UploadError('Desteklenmeyen format. JPG, PNG, WEBP, GIF veya AVIF yükleyin.')
  }
  if ((metadata.width || 0) * (metadata.height || 0) > 50_000_000) {
    throw new UploadError('Görsel çözünürlüğü çok yüksek')
  }

  const preset = PRESETS[kind]
  // rotate(): telefon fotoğraflarındaki EXIF yönünü uygular; animated GIF'in ilk karesi kullanılır
  const output = await preset.process(sharp(buffer, { animated: false }).rotate()).toBuffer()

  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const fileName = `${kind}-${crypto.randomUUID()}.${preset.ext}`
  await fs.writeFile(path.join(UPLOAD_DIR, fileName), output)

  return `/media/${fileName}`
}

export class UploadError extends Error {}

const FILE_NAME_PATTERN = /^(avatar|favicon|og|background|icon)-[0-9a-f-]{36}\.(webp|png|jpg)$/

const CONTENT_TYPES: Record<string, string> = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
}

export async function readUploadedImage(fileName: string): Promise<{ data: Buffer; contentType: string } | null> {
  // Sadece bizim ürettiğimiz dosya adları: dizin dışına çıkma (../) imkansız
  if (!FILE_NAME_PATTERN.test(fileName)) return null
  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, fileName))
    return { data, contentType: CONTENT_TYPES[fileName.split('.').pop() as string] }
  } catch {
    return null
  }
}
