'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { IconType } from 'react-icons'
import * as FaIcons from 'react-icons/fa'
import * as SiIcons from 'react-icons/si'
import Image from 'next/image'
import ContactForm from './ContactForm'
import PasswordModal from './PasswordModal'

interface LinkButtonProps {
  title: string
  url: string
  icon: string
  linkId: number
  type?: string
  contactEmail?: string
  hasPassword?: boolean
  passwordHint?: string
  autoOpen?: boolean
}

export default function LinkButton({ 
  title, 
  url, 
  icon, 
  linkId, 
  type = 'link', 
  contactEmail = '',
  hasPassword = false,
  passwordHint = '',
  autoOpen = false
}: LinkButtonProps) {
  const [showContactForm, setShowContactForm] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    if (autoOpen && hasPassword) setShowPasswordModal(true)
  }, [autoOpen, hasPassword])
  
  // Custom URL mı yoksa ikon adı mı kontrol et
  const isCustomIcon = icon.startsWith('http')

  // Icon'u dinamik olarak al
  const getIcon = (iconName: string): IconType => {
    const allIcons = { ...FaIcons, ...SiIcons } as any
    return allIcons[iconName] || FaIcons.FaLink
  }

  const Icon = !isCustomIcon ? getIcon(icon) : null

  // Tıklama takibi
  const handleClick = async () => {
    try {
      await fetch(`/api/links/${linkId}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Ziyaretçinin geldiği yer ve sayfa URL'sindeki UTM parametreleri analytics'e yazılır
        body: JSON.stringify({ referrer: document.referrer, search: window.location.search }),
        keepalive: true,
      })
    } catch (error) {
      console.error('Click tracking failed:', error)
    }
  }

  // Yeni sekmede aç; tarayıcı popup'ı engellerse aynı sekmede devam et
  const openUrl = (target: string) => {
    const opened = window.open(target, '_blank')
    if (opened) {
      opened.opener = null
    } else {
      window.location.href = target
    }
  }

  // Normal link click - linki hemen aç (popup engelleyicilere takılmaz), tracking arkada gider
  const handleLinkClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (hasPassword) {
      setShowPasswordModal(true)
    } else {
      openUrl(url)
    }
    handleClick()
  }

  // Contact form toggle
  const handleContactClick = async () => {
    setShowContactForm(!showContactForm)
    await handleClick()
  }

  // After password verification success
  const handlePasswordSuccess = async (verifiedLink: string) => {
    setShowPasswordModal(false)
    // Open the verified URL directly
    if (verifiedLink) {
      openUrl(verifiedLink)
    }
  }

  // Normal link davranışı
  if (type === 'link' || type === 'donation') {
    return (
      <>
        <motion.a
          href={hasPassword ? '#' : url}
          rel="noopener noreferrer"
          onClick={handleLinkClick}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="group relative block w-full"
        >
      <div className="absolute inset-0 gradient-primary-accent opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity duration-300" />
      
      <div className="relative flex items-center justify-between px-8 py-5 bg-dynamic-card hover:opacity-90 rounded-2xl border border-gray-800/50 group-hover:border-dynamic-primary transition-all transition-dynamic shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 gradient-primary-accent opacity-25 group-hover:opacity-35 rounded-xl transition-all transition-dynamic">
            {isCustomIcon ? (
              <div className="w-5 h-5 relative">
                <Image
                  src={icon}
                  alt={title}
                  width={20}
                  height={20}
                  className="object-contain brightness-250"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
            ) : Icon ? (
              <Icon className="w-5 h-5 text-dynamic-text transition-colors" />
            ) : null}
          </div>
          <span className="text-lg font-medium text-dynamic-text group-hover:opacity-90 transition-colors">
            {title}
          </span>
          {hasPassword && (
            <FaIcons.FaLock className="w-4 h-4 text-purple-400" />
          )}
        </div>
        
        <motion.div
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <FaIcons.FaArrowRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
        </motion.div>
      </div>
    </motion.a>
    
    <PasswordModal
      isOpen={showPasswordModal}
      onClose={() => setShowPasswordModal(false)}
      onSuccess={handlePasswordSuccess}
      linkTitle={title}
      passwordHint={passwordHint}
      linkId={linkId}
    />
    </>
    )
  }

  // Contact form button davranışı
  return (
    <div className="w-full">
      <motion.button
        onClick={handleContactClick}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="group relative block w-full"
      >
        <div className="absolute inset-0 gradient-primary-accent opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity duration-300" />
        
        <div className="relative flex items-center justify-between px-8 py-5 bg-dynamic-card hover:opacity-90 rounded-2xl border border-gray-800/50 group-hover:border-dynamic-primary transition-all transition-dynamic shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 gradient-primary-accent opacity-20 group-hover:opacity-30 rounded-xl transition-all transition-dynamic">
              {isCustomIcon ? (
                <div className="w-5 h-5 relative">
                  <Image
                    src={icon}
                    alt={title}
                    width={20}
                    height={20}
                    className="object-contain brightness-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
              ) : Icon ? (
                <Icon className="w-5 h-5 text-dynamic-text transition-colors" />
              ) : null}
            </div>
            <span className="text-lg font-medium text-dynamic-text group-hover:opacity-90 transition-colors">
              {title}
            </span>
          </div>
          
          <motion.div
            animate={{ rotate: showContactForm ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <FaIcons.FaChevronDown className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
          </motion.div>
        </div>
      </motion.button>

      {showContactForm && <ContactForm contactEmail={contactEmail} onClose={() => setShowContactForm(false)} />}
    </div>
  )
}
