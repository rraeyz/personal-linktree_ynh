'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FaEnvelope, FaShareAlt, FaAddressCard, FaCheck } from 'react-icons/fa'
import ContactForm from '../ContactForm'

interface ProfileActionsProps {
  shareTitle: string
  showContact: boolean
  showShare: boolean
  showVCard: boolean
}

// Profil kartındaki butonlar: Bana yaz (iletişim formu), Paylaş, Rehbere ekle
export default function ProfileActions({ shareTitle, showContact, showShare, showVCard }: ProfileActionsProps) {
  const [contactOpen, setContactOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!contactOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setContactOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [contactOpen])

  if (!showContact && !showShare && !showVCard) return null

  const share = async () => {
    // Paylaşılan adres: ziyaretçinin bulunduğu sayfa (UTM vb. parametreler hariç)
    const url = window.location.origin + window.location.pathname
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url })
      } catch {
        // kullanıcı vazgeçti
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      prompt('Linki kopyalayın:', url)
    }
  }

  // "Bana yaz" varsa diğerleri yalnızca ikon; yoksa yazılı buton olarak görünür
  const compact = showContact
  const secondary = `inline-flex items-center justify-center gap-2 h-12 rounded-dynamic bg-dynamic-card border border-dynamic text-dynamic-text hover:border-dynamic-primary transition-colors ${compact ? 'w-12' : 'flex-1 px-4 font-medium'}`

  return (
    <div className="flex gap-2.5 w-full max-w-sm lg:max-w-none">
      {showContact && (
        <button
          type="button"
          onClick={() => setContactOpen(true)}
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 px-5 rounded-dynamic bg-dynamic-primary text-white font-semibold hover:opacity-90 transition-opacity"
        >
          <FaEnvelope className="w-4 h-4" aria-hidden="true" /> Bana yaz
        </button>
      )}
      {showShare && (
        <button type="button" onClick={share} className={secondary} aria-label={copied ? 'Link kopyalandı' : 'Paylaş'} title="Paylaş">
          {copied ? <FaCheck className="w-4 h-4" aria-hidden="true" /> : <FaShareAlt className="w-4 h-4" aria-hidden="true" />}
          {!compact && (copied ? 'Kopyalandı' : 'Paylaş')}
        </button>
      )}
      {showVCard && (
        <a href="/api/vcard" download className={secondary} aria-label="Rehbere ekle" title="Rehbere ekle">
          <FaAddressCard className="w-4 h-4" aria-hidden="true" />
          {!compact && 'Rehbere ekle'}
        </a>
      )}

      {mounted && contactOpen && createPortal(
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setContactOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Bana yaz" className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <ContactForm onClose={() => setContactOpen(false)} />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
