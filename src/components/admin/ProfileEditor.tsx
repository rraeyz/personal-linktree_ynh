'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaSave, FaImage, FaGlobe } from 'react-icons/fa'
import Image from 'next/image'

interface ProfileEditorProps {
  initialProfile: any
}

export default function ProfileEditor({ initialProfile }: ProfileEditorProps) {
  const [name, setName] = useState(initialProfile?.name || 'Your Name')
  const [bio, setBio] = useState(initialProfile?.bio || 'Your bio goes here')
  const [imageUrl, setImageUrl] = useState(initialProfile?.imageUrl || '/default-avatar.jpg')
  const [pageTitle, setPageTitle] = useState(initialProfile?.pageTitle || '')
  const [pageDescription, setPageDescription] = useState(initialProfile?.pageDescription || '')
  const [ogImageUrl, setOgImageUrl] = useState(initialProfile?.ogImageUrl || '')
  const [faviconUrl, setFaviconUrl] = useState(initialProfile?.faviconUrl || '')
  const [contactEmail, setContactEmail] = useState(initialProfile?.contactEmail || '')
  const [contactPhone, setContactPhone] = useState(initialProfile?.contactPhone || '')
  const [contactAddress, setContactAddress] = useState(initialProfile?.contactAddress || '')
  const [verified, setVerified] = useState(initialProfile?.verified || false)
  const [badges, setBadges] = useState(initialProfile?.badges || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [faviconUploading, setFaviconUploading] = useState(false)
  const router = useRouter()

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Dosya boyutu kontrolü (maks 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Dosya boyutu 2MB\'dan küçük olmalıdır')
      return
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      alert('Lütfen bir görsel dosyası seçin')
      return
    }

    setUploading(true)
    try {
      // Dosyayı base64'e çevir
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageUrl(reader.result as string)
        setUploading(false)
      }
      reader.onerror = () => {
        alert('Dosya yükleme hatası')
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      alert('Dosya yükleme hatası')
      setUploading(false)
    }
  }

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Dosya boyutu kontrolü (maks 500KB - favicon'lar küçük olmalı)
    if (file.size > 500 * 1024) {
      alert('Favicon boyutu 500KB\'dan küçük olmalıdır')
      return
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      alert('Lütfen bir görsel dosyası seçin (PNG, ICO, SVG önerilir)')
      return
    }

    setFaviconUploading(true)
    try {
      // Dosyayı base64'e çevir
      const reader = new FileReader()
      reader.onloadend = () => {
        setFaviconUrl(reader.result as string)
        setFaviconUploading(false)
      }
      reader.onerror = () => {
        alert('Dosya yükleme hatası')
        setFaviconUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      alert('Dosya yükleme hatası')
      setFaviconUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      // Profil bilgilerini güncelle
      const profileResponse = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          bio, 
          imageUrl,
          contactEmail,
          contactPhone,
          contactAddress,
          verified,
          badges
        }),
      })

      if (!profileResponse.ok) {
        throw new Error('Kayıt başarısız')
      }

      // SEO bilgilerini güncelle
      const seoResponse = await fetch('/api/profile/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageTitle, pageDescription, ogImageUrl, faviconUrl }),
      })

      if (!seoResponse.ok) {
        throw new Error('SEO kayıt başarısız')
      }

      setMessage('Profil başarıyla güncellendi!')
      router.refresh()
      
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-dark-card border border-gray-800 rounded-2xl p-8">
      <h2 className="text-xl font-bold text-white mb-6">Profil Bilgileri</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Preview */}
        <div className="flex items-center gap-6 p-6 bg-dark-bg rounded-xl">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-purple-500/20">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                if (!target.src.endsWith('/default-avatar.jpg')) target.src = '/default-avatar.jpg'
              }}
            />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{name}</h3>
            <p className="text-gray-400 mt-1">{bio}</p>
          </div>
        </div>

        {/* Form Fields */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            İsim
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
            required
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
            Biyografi
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
            required
          />
        </div>

        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-300 mb-2">
            Profil Fotoğrafı
          </label>
          
          <div className="space-y-3">
            {/* Dosya Yükleme */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors cursor-pointer">
                <FaImage className="w-4 h-4" />
                <span>{uploading ? 'Yükleniyor...' : 'Dosya Yükle'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <span className="text-sm text-gray-500">veya URL girin:</span>
            </div>

            {/* URL Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaImage className="text-gray-500" />
                </div>
                <input
                  id="imageUrl"
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Maksimum 2MB • PNG, JPG, GIF desteklenir
          </p>
        </div>

        {/* İletişim Ayarları */}
        <div className="pt-6 border-t border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <FaImage className="text-purple-400" />
            <h3 className="text-lg font-semibold text-white">İletişim Bilgileri</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Bu bilgiler iletişim formundan gelen mesajlarda kullanılır
          </p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-300 mb-2">
                İletişim E-posta
              </label>
              <input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="ornek@email.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                İletişim formundan gelen mesajlar bu adrese gönderilir
              </p>
            </div>

            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-300 mb-2">
                Telefon (Opsiyonel)
              </label>
              <input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="+90 555 123 4567"
              />
            </div>

            <div>
              <label htmlFor="contactAddress" className="block text-sm font-medium text-gray-300 mb-2">
                Adres (Opsiyonel)
              </label>
              <textarea
                id="contactAddress"
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
                placeholder="Şehir, Ülke"
              />
            </div>
          </div>
        </div>

        {/* SEO Ayarları */}
        <div className="pt-6 border-t border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <FaGlobe className="text-purple-400" />
            <h3 className="text-lg font-semibold text-white">SEO & Social Media</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="pageTitle" className="block text-sm font-medium text-gray-300 mb-2">
                Sayfa Başlığı (Meta Title)
              </label>
              <input
                id="pageTitle"
                type="text"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder={name || "Adınız | Link Tree"}
              />
              <p className="text-xs text-gray-500 mt-1">
                Boş bırakırsanız profil adınız kullanılır
              </p>
            </div>

            <div>
              <label htmlFor="pageDescription" className="block text-sm font-medium text-gray-300 mb-2">
                Sayfa Açıklaması (Meta Description)
              </label>
              <textarea
                id="pageDescription"
                value={pageDescription}
                onChange={(e) => setPageDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
                placeholder={bio || "Tüm linklerim burada"}
              />
              <p className="text-xs text-gray-500 mt-1">
                Boş bırakırsanız biyografiniz kullanılır
              </p>
            </div>

            <div>
              <label htmlFor="ogImageUrl" className="block text-sm font-medium text-gray-300 mb-2">
                Social Media Görseli (Open Graph)
              </label>
              <input
                id="ogImageUrl"
                type="url"
                value={ogImageUrl}
                onChange={(e) => setOgImageUrl(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder={imageUrl || "https://example.com/og-image.jpg"}
              />
              <p className="text-xs text-gray-500 mt-1">
                Twitter ve Facebook paylaşımlarında görünecek. Boş bırakırsanız profil fotoğrafınız kullanılır.
              </p>
            </div>

            <div>
              <label htmlFor="faviconUrl" className="block text-sm font-medium text-gray-300 mb-2">
                🌐 Site İkonu (Favicon)
              </label>
              
              <div className="space-y-3">
                {/* Dosya Yükleme */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors cursor-pointer">
                    <FaGlobe className="w-4 h-4" />
                    <span>{faviconUploading ? 'Yükleniyor...' : 'Favicon Yükle'}</span>
                    <input
                      type="file"
                      accept="image/*,.ico"
                      onChange={handleFaviconUpload}
                      className="hidden"
                      disabled={faviconUploading}
                    />
                  </label>
                  <span className="text-sm text-gray-500">veya URL girin:</span>
                </div>

                {/* URL Input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaGlobe className="text-gray-500" />
                    </div>
                    <input
                      id="faviconUrl"
                      type="text"
                      value={faviconUrl}
                      onChange={(e) => setFaviconUrl(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                Tarayıcı sekmesinde görünen ikon • Maks 500KB • PNG, ICO, SVG önerilir
              </p>
            </div>
          </div>
        </div>

        {/* Rozet ve Doğrulama Ayarları */}
        <div className="pt-6 border-t border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Rozetler & Doğrulama</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-dark-bg rounded-xl">
              <div>
                <label htmlFor="verified" className="text-sm font-medium text-gray-300">
                  Doğrulanmış Profil
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Mavi onay rozeti görüntüler
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="verified"
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>

            <div>
              <label htmlFor="badges" className="block text-sm font-medium text-gray-300 mb-2">
                Rozetler (JSON Array)
              </label>
              <input
                id="badges"
                type="text"
                value={badges}
                onChange={(e) => setBadges(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors font-mono text-sm"
                placeholder='["premium", "star", "supporter"]'
              />
              <p className="text-xs text-gray-500 mt-1">
                Kullanılabilir rozetler: <span className="text-yellow-400">premium</span>, <span className="text-purple-400">star</span>, <span className="text-pink-400">supporter</span>
              </p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm ${
            message.includes('başarıyla') 
              ? 'bg-green-500/10 border border-green-500/50 text-green-400'
              : 'bg-red-500/10 border border-red-500/50 text-red-400'
          }`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaSave className="w-4 h-4" />
          <span>{saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
        </button>
      </form>
    </div>
  )
}
