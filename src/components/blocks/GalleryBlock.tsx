'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa'

// Görsel galerisi: ızgara + tıklayınca tam ekran görüntüleyici (ok tuşları / Esc)
export default function GalleryBlock({ title, images }: { title: string; images: string[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const close = useCallback(() => setOpen(null), [])
  const move = useCallback((step: number) => {
    setOpen((current) => (current === null ? null : (current + step + images.length) % images.length))
  }, [images.length])

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') move(1)
      if (e.key === 'ArrowLeft') move(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close, move])

  if (images.length === 0) return null
  const columns = images.length === 1 ? 'grid-cols-1' : images.length === 2 || images.length === 4 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <section className="w-full">
      {title && <h3 className="text-sm font-medium text-dynamic-text opacity-70 mb-2 px-1">{title}</h3>}
      <div className={`grid ${columns} gap-2`}>
        {images.map((src, index) => (
          <button
            key={src + index}
            type="button"
            onClick={() => setOpen(index)}
            className="relative overflow-hidden rounded-dynamic aspect-square bg-dynamic-card focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]"
            aria-label={`${title || 'Galeri'} görsel ${index + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          </button>
        ))}
      </div>

      {mounted && open !== null && createPortal(
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={close} role="dialog" aria-modal="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[open]} alt="" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          <button type="button" onClick={close} className="absolute top-4 right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Kapat">
            <FaTimes />
          </button>
          {images.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); move(-1) }} className="absolute left-3 p-3 rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Önceki">
                <FaChevronLeft />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); move(1) }} className="absolute right-3 p-3 rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Sonraki">
                <FaChevronRight />
              </button>
              <div className="absolute bottom-4 text-white/70 text-sm">{open + 1} / {images.length}</div>
            </>
          )}
        </div>,
        document.body
      )}
    </section>
  )
}
