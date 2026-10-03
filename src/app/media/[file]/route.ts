import { readUploadedImage } from '@/lib/uploads'

export const dynamic = 'force-dynamic'

// Yüklenen görselleri servis eder. Dosya adları rastgele UUID içerdiği ve dosyalar
// hiç değiştirilmediği için tarayıcı önbelleğinde süresiz tutulabilir.
export async function GET(_request: Request, { params }: { params: { file: string } }) {
  const image = await readUploadedImage(params.file)
  if (!image) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(new Uint8Array(image.data), {
    headers: {
      'Content-Type': image.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
