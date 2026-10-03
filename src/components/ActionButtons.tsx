'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaShare, FaEnvelope, FaTimes } from 'react-icons/fa'

interface ActionButtonsProps {
  url: string
  title: string
}

export default function ActionButtons({ url, title }: ActionButtonsProps) {
  const [showSubscribe, setShowSubscribe] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(url)
      alert('Link kopyalandı!')
    }
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setMessage('')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })

      if (!response.ok) {
        throw new Error('Abonelik başarısız')
      }

      setMessage('Bültene başarıyla abone oldunuz! 🎉')
      setEmail('')
      setName('')
      
      setTimeout(() => {
        setShowSubscribe(false)
        setMessage('')
      }, 2000)
    } catch (error) {
      setMessage('Bir hata oluştu, lütfen tekrar deneyin.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-12 space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <motion.button
          onClick={handleShare}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-3 gradient-primary-accent text-white font-medium rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all"
        >
          <FaShare className="w-4 h-4" />
          Paylaş
        </motion.button>

        <motion.button
          onClick={() => setShowSubscribe(!showSubscribe)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-3 bg-dynamic-card border-2 border-dynamic-primary text-dynamic-text font-medium rounded-xl hover-dynamic transition-all"
        >
          <FaEnvelope className="w-4 h-4" />
          Abone Ol
        </motion.button>
      </div>

      {/* Subscribe Form */}
      <AnimatePresence>
        {showSubscribe && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-dynamic-card rounded-xl border border-dynamic">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-dynamic-text">Bültene Abone Ol</h3>
                <button
                  onClick={() => setShowSubscribe(false)}
                  className="p-2 hover-dynamic rounded-lg transition-colors"
                >
                  <FaTimes className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubscribe} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-dynamic-input border border-dynamic rounded-lg text-dynamic-text focus:outline-none focus:border-dynamic-primary transition-colors"
                    placeholder="Adınız (opsiyonel)"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-dynamic-input border border-dynamic rounded-lg text-dynamic-text focus:outline-none focus:border-dynamic-primary transition-colors"
                    placeholder="E-posta adresiniz"
                  />
                </div>

                {message && (
                  <div className={`px-4 py-3 rounded-lg text-sm ${
                    message.includes('başarıyla')
                      ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                      : 'bg-red-500/10 border border-red-500/50 text-red-400'
                  }`}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="flex items-center justify-center gap-2 w-full gradient-primary-accent text-white font-medium py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                >
                  <FaEnvelope className="w-4 h-4" />
                  <span>{sending ? 'Kaydediliyor...' : 'Abone Ol'}</span>
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Güncellemelerden haberdar olmak için e-posta adresinizi kaydedin
                </p>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
