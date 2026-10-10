'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import ContactForm from '../ContactForm'

interface ContactModalProps {
  open: boolean
  onClose: () => void
}

// İletişim formu penceresi: profil kartındaki "Bana yaz" butonu ve "İletişim formu" bloğu ortak kullanır.
// Sayfanın üstünde açılır; sayfa düzenini kaydırmaz, altındaki bloklarla çakışmaz.
export default function ContactModal({ open, onClose }: ContactModalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    // Pencere açıkken arkadaki sayfa kaymasın
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Bana yaz" className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <ContactForm onClose={onClose} />
      </div>
    </div>,
    document.body
  )
}
