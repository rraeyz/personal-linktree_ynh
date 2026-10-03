'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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
  // Öne çıkan link: vurgulu, animasyonlu çerçeve
  featured?: boolean
  // Önizleme görseli (/media/... veya http(s))
  thumbnail?: string
  // row: klasik liste satırı, tile: bento ızgara kutusu
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
    iconElement ?? <FaLink className="w-5 h-5 text-dynamic-text transition-colors" />
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

  const trailing = isContact ? (
    <motion.div animate={{ rotate: showContactForm ? 180 : 0 }} transition={{ duration: 0.3 }}>
      <FaChevronDown className="w-5 h-5 text-gray-500 group-hover:text-[color:var(--color-primary)] transition-colors" />
    </motion.div>
  ) : (
    <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
      <FaArrowRight className="w-5 h-5 text-gray-500 group-hover:text-[color:var(--color-primary)] transition-colors" />
    </motion.div>
  )

  const lockBadge = hasPassword && <FaLock className="w-4 h-4 shrink-0 text-dynamic-primary" aria-label="Şifreli" />

  const iconBox = thumbnail ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={thumbnail} alt="" className="w-12 h-12 rounded-dynamic object-cover shrink-0" loading="lazy" />
  ) : (
    <div className="p-3 gradient-primary-accent opacity-25 group-hover:opacity-35 rounded-xl transition-all transition-dynamic shrink-0">
      {iconNode}
    </div>
  )

  const cardClass = `link-card relative bg-dynamic-card hover:opacity-90 rounded-dynamic border border-dynamic group-hover:border-dynamic-primary transition-all transition-dynamic shadow-lg ${featured ? 'featured-card' : ''}`

  let body: React.ReactNode
  if (variant === 'tile') {
    // Bento kutusu: üstte görsel/ikon, altta başlık
    body = (
      <div className={`${cardClass} h-full flex flex-col overflow-hidden`}>
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt="" className="w-full aspect-video object-cover" loading="lazy" />
        ) : (
          <div className="px-5 pt-5">
            <div className="inline-flex p-3 gradient-primary-accent opacity-25 group-hover:opacity-35 rounded-xl">{iconNode}</div>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 px-5 py-4 mt-auto">
          <span className={`${featured ? 'text-lg' : 'text-base'} font-medium text-dynamic-text leading-snug`}>{title}</span>
          {lockBadge}
        </div>
      </div>
    )
  } else if (featured && thumbnail) {
    // Öne çıkan + görselli: üstte geniş görsel
    body = (
      <div className={`${cardClass} overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbnail} alt="" className="w-full aspect-[2/1] object-cover" loading="lazy" />
        <div className="flex items-center justify-between gap-4 px-8 py-5">
          <span className="text-xl font-semibold text-dynamic-text">{title}</span>
          <div className="flex items-center gap-3">{lockBadge}{trailing}</div>
        </div>
      </div>
    )
  } else {
    body = (
      <div className={`${cardClass} flex items-center justify-between ${featured ? 'px-8 py-7' : 'px-8 py-5'}`}>
        <div className="flex items-center gap-4 min-w-0">
          {iconBox}
          <span className={`${featured ? 'text-xl font-semibold' : 'text-lg font-medium'} text-dynamic-text group-hover:opacity-90 transition-colors`}>
            {title}
          </span>
          {lockBadge}
        </div>
        {trailing}
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <motion.a
        href={hasPassword || isContact ? '#' : url}
        rel="noopener noreferrer"
        onClick={handleClick}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="group relative block w-full h-full"
        aria-expanded={isContact ? showContactForm : undefined}
      >
        <div className="absolute inset-0 gradient-primary-accent opacity-0 group-hover:opacity-20 rounded-dynamic blur-xl transition-opacity duration-300" />
        {body}
      </motion.a>

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
