'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { FaCheckCircle, FaCrown, FaStar, FaHeart } from 'react-icons/fa'

interface ProfileSectionProps {
  name: string
  bio: string
  imageUrl: string
  verified?: boolean
  badges?: string
}

// Badge ikonları
const badgeIcons: Record<string, any> = {
  verified: FaCheckCircle,
  premium: FaCrown,
  star: FaStar,
  supporter: FaHeart,
}

const badgeColors: Record<string, string> = {
  verified: 'text-blue-400',
  premium: 'text-yellow-400',
  star: 'text-purple-400',
  supporter: 'text-pink-400',
}

export default function ProfileSection({ name, bio, imageUrl, verified, badges }: ProfileSectionProps) {
  let badgeArray: string[] = []
  try {
    badgeArray = badges ? JSON.parse(badges) : []
  } catch {
    badgeArray = []
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center text-center"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative w-32 h-32 mb-6"
      >
        <div className="absolute inset-0 gradient-primary-accent rounded-full blur-lg opacity-50 animate-pulse" />
        <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-dynamic-primary shadow-2xl">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            priority
            onError={(e) => {
              // Yalnızca bir kez varsayılana dön; varsayılan da yüklenemezse döngüye girme
              const target = e.target as HTMLImageElement
              if (!target.src.endsWith('/default-avatar.jpg')) {
                target.src = '/default-avatar.jpg'
              }
            }}
          />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-4xl font-bold mb-3 text-dynamic-text flex items-center justify-center gap-2"
      >
        {name}
        {verified && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.5 }}
            className="text-blue-400"
            title="Doğrulanmış Profil"
          >
            <FaCheckCircle className="w-6 h-6" />
          </motion.span>
        )}
      </motion.h1>

      {/* Rozetler */}
      {badgeArray.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex gap-2 mb-3"
        >
          {badgeArray.map((badge: string, index: number) => {
            const Icon = badgeIcons[badge]
            const color = badgeColors[badge]
            if (!Icon) return null
            return (
              <motion.span
                key={badge}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.5 + index * 0.1 }}
                className={`${color} opacity-80 hover:opacity-100 transition-opacity cursor-help`}
                title={badge.charAt(0).toUpperCase() + badge.slice(1)}
              >
                <Icon className="w-5 h-5" />
              </motion.span>
            )
          })}
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-dynamic-text opacity-70 max-w-md text-lg"
      >
        {bio}
      </motion.p>
    </motion.div>
  )
}
