import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { isUploadKind, MAX_UPLOAD_BYTES, saveUploadedImage, UploadError } from '@/lib/uploads'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentLength = parseInt(request.headers.get('content-length') || '0')
    if (contentLength > MAX_UPLOAD_BYTES + 1024 * 1024) {
      return NextResponse.json({ error: 'Dosya en fazla 10 MB olabilir' }, { status: 413 })
    }

    const form = await request.formData()
    const file = form.get('file')
    const kind = form.get('kind')

    if (!(file instanceof Blob) || !isUploadKind(kind)) {
      return NextResponse.json({ error: 'Geçersiz yükleme isteği' }, { status: 400 })
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Dosya en fazla 10 MB olabilir' }, { status: 413 })
    }

    const url = await saveUploadedImage(Buffer.from(await file.arrayBuffer()), kind)
    return NextResponse.json({ url })
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Yükleme başarısız' }, { status: 500 })
  }
}
