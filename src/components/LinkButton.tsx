'use client'

import { useEffect, useState } from 'react'
import { FaArrowRight, FaChevronDown, FaLink, FaLock } from 'react-icons/fa'
import ContactForm from './ContactForm'
import PasswordModal from './PasswordModal'
import { openUrl, trackClick } from '@/lib/clientLinks'

interface LinkButtonProps {
  title: string
  url: string
  icon: string
  // Sunucuda çizilmiş ikon (bkz. lib/linkIcon); verilmezse varsayılan link ikonu
  iconElement?: React.ReactNode
  linkId: number
  type?: string
  hasPassword?: boolean
  passwordHint?: string
  autoOpen?: boolean
  // Öne çıkan link: geniş kart, animasyonlu çerçeve
  featured?: boolean
  // Önizleme görseli (/media/... veya http(s))
  thumbnail?: string
  // Başlığın altındaki kısa açıklama (opsiyonel)
  description?: string
  // row: liste satırı, tile: ızgara kutusu (telefonda da ikişerli)
  variant?: 'row' | 'tile'
}

export default function LinkButton({
  title,
  url,
  icon,
  iconElement,
  linkId,
  type = 'link',
  hasPassword = false,
  passwordHint = '',
  autoOpen = false,
  featured = false,
  thumbnail = '',
  description = '',
  variant = 'row',
}: LinkButtonProps) {
  const [showContactForm, setShowContactForm] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    if (autoOpen && hasPassword) setShowPasswordModal(true)
  }, [autoOpen, hasPassword])

  const isContact = type === 'contact'
  const isCustomIcon = icon.startsWith('http')

  const iconNode = isCustomIcon ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={icon}
      alt=""
      width={20}
      height={20}
      className="w-5 h-5 object-contain"
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  ) : (
    iconElement ?? <FaLink className="w-[18px] h-[18px]" />
  )

  // Linki hemen aç (popup engelleyicilere takılmaz), tıklama kaydı arkada gider
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    trackClick(linkId)
    if (isContact) {
      setShowContactForm(!showContactForm)
    } else if (hasPassword) {
      setShowPasswordModal(true)
    } else {
      openUrl(url)
    }
  }

  const handlePasswordSuccess = (verifiedLink: string) => {
    setShowPasswordModal(false)
    if (verifiedLink) openUrl(verifiedLink)
  }

  const lockBadge = hasPassword && <FaLock className="w-4 h-4 shrink-0 text-dynamic-primary" aria-label="Şifreli" />
  const trailing = isContact ? (
    <FaChevronDown className={`w-4 h-4 shrink-0 opacity-60 transition-transform ${showContactForm ? 'rotate-180' : ''}`} aria-hidden="true" />
  ) : (
    <FaArrowRight className="w-4 h-4 shrink-0 opacity-50 -rotate-45 group-hover:opacity-100 group-hover:text-[color:var(--color-primary)] transition-all" aria-hidden="true" />
  )

  const cardClass = `link-card relative bg-dynamic-card rounded-dynamic border border-dynamic transition-colors ${featured ? 'featured-card' : ''}`

  let body: React.ReactNode
  if (featured) {
    // Öne çıkan: geniş ekranda solda görsel, sağda başlık + açıklama
    body = (
      <div className={`${cardClass} overflow-hidden flex flex-col md:flex-row`}>
        {thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt="" className="w-full md:w-1/2 aspect-[16/9] md:aspect-auto md:min-h-[220px] object-cover" loading="lazy" />
        )}
        <div className="flex-1 flex flex-col justify-center gap-2 p-5 md:p-7 text-dynamic-text">
          <span className="kicker text-dynamic-primary !opacity-100">Öne çıkan</span>
          <span className="flex items-center gap-2 text-xl md:text-2xl font-semibold leading-snug">{title}{lockBadge}</span>
          {description && <span className="opacity-75 leading-relaxed whitespace-pre-line line-clamp-4">{description}</span>}
          <span className="inline-flex items-center gap-2 mt-1 font-semibold text-dynamic-primary">
            {isContact ? 'Formu aç' : 'Git'} <FaArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    )
  } else if (variant === 'tile') {
    // Izgara kutusu: üstte görsel/ikon, altta başlık
    body = (
      <div className={`${cardClass} h-full flex flex-col overflow-hidden text-dynamic-text`}>
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt="" className="w-full aspect-video object-cover" loading="lazy" />
        ) : (
          <div className="px-4 pt-4"><span className="icon-chip">{iconNode}</span></div>
        )}
        <div className="flex items-start justify-between gap-2 px-4 py-3 mt-auto">
          <span className="min-w-0">
            <span className="block font-semibold leading-snug">{title}</span>
            {description && <span className="block text-sm opacity-70 line-clamp-2 mt-0.5">{description}</span>}
          </span>
          {lockBadge}
        </div>
      </div>
    )
  } else {
    body = (
      <div className={`${cardClass} h-full flex items-center gap-3.5 px-3.5 py-3 min-h-[64px] text-dynamic-text`}>
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" loading="lazy" />
        ) : (
          <span className="icon-chip">{iconNode}</span>
        )}
        <span className="flex-1 min-w-0">
          <span className="block font-semibold leading-snug">{title}</span>
          {description && <span className="block text-sm opacity-70 truncate mt-0.5">{description}</span>}
        </span>
        {lockBadge}
        {trailing}
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <a
        href={hasPassword || isContact ? '#' : url}
        rel="noopener noreferrer"
        onClick={handleClick}
        className="group relative block w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] rounded-dynamic"
        aria-expanded={isContact ? showContactForm : undefined}
      >
        {body}
      </a>

      {isContact && showContactForm && <ContactForm onClose={() => setShowContactForm(false)} />}

      {hasPassword && (
        <PasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={handlePasswordSuccess}
          linkTitle={title}
          passwordHint={passwordHint}
          linkId={linkId}
        />
      )}
    </div>
  )
}
