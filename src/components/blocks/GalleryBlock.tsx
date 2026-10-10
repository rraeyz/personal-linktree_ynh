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
  // En fazla 8 küçük görsel; fazlası son kutuda "+N" olarak görünür, tıklayınca görüntüleyicide gezilir
  const MAX_THUMBS = 8
  const shown = images.slice(0, MAX_THUMBS)
  const hiddenCount = images.length - shown.length
  const columns = shown.length === 1 ? 'grid-cols-1' : shown.length === 2 ? 'grid-cols-2' : 'grid-cols-3 sm:grid-cols-4'

  return (
    <section className="site-card w-full p-3 text-dynamic-text">
      <div className="flex items-center justify-between gap-3 px-1 pt-1 pb-2.5">
        <h3 className="kicker">{title || 'Galeri'}</h3>
        <span className="text-xs opacity-60">{images.length} görsel</span>
      </div>
      <div className={`grid ${columns} gap-2`}>
        {shown.map((src, index) => {
          const isLast = index === shown.length - 1 && hiddenCount > 0
          return (
            <button
              key={src + index}
              type="button"
              onClick={() => setOpen(index)}
              className={`relative overflow-hidden rounded-dynamic ${shown.length === 1 ? 'aspect-video' : 'aspect-square'} bg-dynamic-input focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]`}
              aria-label={isLast ? `${title || 'Galeri'}: ${hiddenCount + 1} görsel daha` : `${title || 'Galeri'} görsel ${index + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              {isLast && (
                <span className="absolute inset-0 bg-black/55 text-white text-lg font-semibold flex items-center justify-center">+{hiddenCount + 1}</span>
              )}
            </button>
          )
        })}
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
