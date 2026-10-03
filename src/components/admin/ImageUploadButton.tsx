'use client'

import { useState } from 'react'
import { FaImage, FaSpinner } from 'react-icons/fa'

interface ImageUploadButtonProps {
  kind: 'avatar' | 'favicon' | 'og' | 'background' | 'icon' | 'cover' | 'thumb' | 'gallery'
  onUploaded: (url: string) => void
  label?: string
  className?: string
}

// Görseli sunucuya yükler; sunucu boyutlandırıp /media/... adresini döner
export default function ImageUploadButton({ kind, onUploaded, label = 'Dosya Yükle', className = '' }: ImageUploadButtonProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // aynı dosya tekrar seçilebilsin
    if (!file) return

    setError('')
    if (file.size > 10 * 1024 * 1024) {
      setError('Dosya en fazla 10 MB olabilir')
      return
    }

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('kind', kind)
      const response = await fetch('/api/admin/upload', { method: 'POST', body: form })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Yükleme başarısız')
      }
      onUploaded(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yükleme başarısız')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label
        className={`inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors cursor-pointer ${uploading ? 'opacity-60 cursor-wait' : ''} ${className}`}
      >
        {uploading ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaImage className="w-4 h-4" />}
        <span>{uploading ? 'Yükleniyor...' : label}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          onChange={handleChange}
          className="hidden"
          disabled={uploading}
        />
      </label>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
