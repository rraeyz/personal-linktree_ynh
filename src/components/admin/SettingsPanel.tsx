'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FaKey, FaCog, FaFileExport, FaFileImport, FaSave, FaTrash, FaChartLine, FaEnvelope } from 'react-icons/fa'

export default function SettingsPanel() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [retentionDays, setRetentionDays] = useState(90)
  const [analyticsMessage, setAnalyticsMessage] = useState('')
  
  // Email settings
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState(587)
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [hasSmtpPassword, setHasSmtpPassword] = useState(false)
  const [smtpFrom, setSmtpFrom] = useState('')
  const [smtpFromName, setSmtpFromName] = useState('')
  const [smtpSecure, setSmtpSecure] = useState(false)
  const [smtpMessage, setSmtpMessage] = useState('')
  const [smtpSaving, setSmtpSaving] = useState(false)
  
  // Email signature settings
  const [companyName, setCompanyName] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [twitterUrl, setTwitterUrl] = useState('')
  const [discordUrl, setDiscordUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [signatureMessage, setSignatureMessage] = useState('')
  const [signatureSaving, setSignatureSaving] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    // Mevcut ayarı yükle
    fetch('/api/admin/analytics-retention')
      .then(res => res.json())
      .then(data => {
        if (data.retentionDays !== undefined) {
          setRetentionDays(data.retentionDays)
        }
      })
      .catch(console.error)
      
    // Email ayarlarını yükle
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setSmtpHost(data.smtpHost || '')
          setSmtpPort(data.smtpPort || 587)
          setSmtpUser(data.smtpUser || '')
          setSmtpPassword('')
          setHasSmtpPassword(!!data.hasSmtpPassword)
          setSmtpFrom(data.smtpFrom || '')
          setSmtpFromName(data.smtpFromName || '')
          setSmtpSecure(data.smtpSecure || false)
          setCompanyName(data.companyName || '')
          setCompanyAddress(data.companyAddress || '')
          setLinkedinUrl(data.linkedinUrl || '')
          setTwitterUrl(data.twitterUrl || '')
          setDiscordUrl(data.discordUrl || '')
          setYoutubeUrl(data.youtubeUrl || '')
          setInstagramUrl(data.instagramUrl || '')
          setGithubUrl(data.githubUrl || '')
        }
      })
      .catch(console.error)
  }, [])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setMessage('Yeni şifreler eşleşmiyor')
      return
    }

    if (newPassword.length < 8) {
      setMessage('Yeni şifre en az 8 karakter olmalı')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Şifre başarıyla değiştirildi! Tüm oturumlar kapatıldı, yeni şifrenizle giriş yapın.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        
        setTimeout(() => {
          router.push('/admin/login')
        }, 2000)
      } else {
        setMessage(data.error || 'Şifre değiştirme başarısız')
      }
    } catch (error) {
      setMessage('Bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleExportSettings = async () => {
    try {
      const response = await fetch('/api/admin/export-settings')
      const data = await response.json()

      if (response.ok) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `linktree-settings-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        setMessage('Ayarlar dışa aktarıldı!')
      } else {
        setMessage('Dışa aktarma başarısız')
      }
    } catch (error) {
      setMessage('Bir hata oluştu')
    }
  }

  const handleImportSettings = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const settings = JSON.parse(text)

      const response = await fetch('/api/admin/import-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setMessage('Ayarlar başarıyla içe aktarıldı!')
        setTimeout(() => router.refresh(), 1000)
      } else {
        setMessage('İçe aktarma başarısız')
      }
    } catch (error) {
      setMessage('Geçersiz dosya formatı')
    }
  }

  const handleRetentionChange = async (days: number) => {
    setAnalyticsMessage('')
    
    try {
      const response = await fetch('/api/admin/analytics-retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retentionDays: days }),
      })

      const data = await response.json()

      if (response.ok) {
        // API'den dönen değeri kullan - bu garantiyle kaydedildi
        setRetentionDays(data.retentionDays)
        setAnalyticsMessage(data.message || 'Ayar kaydedildi')
      } else {
        setAnalyticsMessage('Kaydetme başarısız')
      }
    } catch (error) {
      setAnalyticsMessage('Bir hata oluştu')
    }
  }

  const handleClearAnalytics = async () => {
    if (!confirm('TÜM analytics verileri silinecek! Emin misiniz?')) {
      return
    }

    setAnalyticsMessage('')
    
    try {
      const response = await fetch('/api/admin/clear-analytics', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setAnalyticsMessage(data.message || 'Veriler temizlendi')
        setTimeout(() => router.refresh(), 1000)
      } else {
        setAnalyticsMessage('Temizleme başarısız')
      }
    } catch (error) {
      setAnalyticsMessage('Bir hata oluştu')
    }
  }

  const handleSmtpSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSmtpSaving(true)
    setSmtpMessage('')

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPassword,
          smtpFrom,
          smtpFromName,
          smtpSecure,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setHasSmtpPassword(!!data.hasSmtpPassword)
        setSmtpPassword('')
        setSmtpMessage('SMTP ayarları kaydedildi!')
      } else {
        setSmtpMessage(data.error || 'Kaydetme başarısız')
      }
    } catch (error) {
      setSmtpMessage('Bir hata oluştu')
    } finally {
      setSmtpSaving(false)
    }
  }

  const handleSignatureSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignatureSaving(true)
    setSignatureMessage('')

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          companyAddress,
          linkedinUrl,
          twitterUrl,
          discordUrl,
          youtubeUrl,
          instagramUrl,
          githubUrl
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSignatureMessage('E-posta imzası kaydedildi!')
      } else {
        setSignatureMessage(data.error || 'Kaydetme başarısız')
      }
    } catch (error) {
      setSignatureMessage('Bir hata oluştu')
    } finally {
      setSignatureSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <div className="bg-dark-card border border-gray-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <FaKey className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Şifre Değiştir</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mevcut Şifre
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Yeni Şifre
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Yeni Şifre (Tekrar)
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
              required
              minLength={8}
            />
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
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50"
          >
            <FaSave className="w-4 h-4" />
            <span>{saving ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}</span>
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-800">
          <h3 className="text-sm font-medium text-gray-300 mb-1">Tüm cihazlardan çıkış yap</h3>
          <p className="text-xs text-gray-500 mb-3">
            Başka bir bilgisayarda veya telefonda açık kalmış oturumlar dahil tüm oturumları kapatır.
          </p>
          <button
            type="button"
            onClick={async () => {
              if (!confirm('Tüm cihazlardaki oturumlar kapatılacak. Devam edilsin mi?')) return
              await fetch('/api/auth/logout-all', { method: 'POST' })
              router.push('/admin/login')
            }}
            className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
          >
            Tüm oturumları kapat
          </button>
        </div>
      </div>

      {/* Import/Export Settings */}
      <div className="bg-dark-card border border-gray-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <FaCog className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Ayarları Yönet</h2>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Tüm Ayarları Yedekle
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Profil, linkler, temalar ve diğer tüm ayarlarınızı JSON dosyası olarak kaydedin.
            </p>
            <button
              onClick={handleExportSettings}
              className="flex items-center gap-2 px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-colors border border-blue-500/30"
            >
              <FaFileExport className="w-4 h-4" />
              <span>Ayarları Dışa Aktar (.json)</span>
            </button>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Yedekten Geri Yükle
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Daha önce dışa aktardığınız ayarları içe aktararak tüm yapılandırmanızı geri yükleyin.
            </p>
            <label className="flex items-center gap-2 px-4 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl transition-colors border border-green-500/30 cursor-pointer">
              <FaFileImport className="w-4 h-4" />
              <span>Ayarları İçe Aktar (.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportSettings}
                className="hidden"
              />
            </label>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mt-4">
            <p className="text-sm text-yellow-400">
              ⚠️ <strong>Uyarı:</strong> İçe aktarma işlemi mevcut ayarlarınızın <strong>üzerine yazacaktır</strong>. 
              İşlemden önce mevcut ayarlarınızı dışa aktararak yedeklemeniz önerilir.
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Settings */}
      <div className="bg-dark-card border border-gray-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <FaChartLine className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Analytics Ayarları</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Veri Saklama Süresi
            </label>
            <p className="text-sm text-gray-400 mb-4">
              Analytics verilerinin ne kadar süre saklanacağını belirleyin. Süresi geçen veriler otomatik silinir.
            </p>
            <select
              value={retentionDays}
              onChange={(e) => handleRetentionChange(Number(e.target.value))}
              className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value={0}>Sonsuza kadar sakla</option>
              <option value={7}>7 gün</option>
              <option value={30}>30 gün</option>
              <option value={60}>60 gün</option>
              <option value={90}>90 gün (Önerilen)</option>
              <option value={180}>180 gün</option>
              <option value={365}>1 yıl</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Verileri Temizle
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Tüm analytics verilerini ve link tıklama sayaçlarını sıfırlayın.
            </p>
            <button
              onClick={handleClearAnalytics}
              className="flex items-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors border border-red-500/30"
            >
              <FaTrash className="w-4 h-4" />
              <span>Tüm Analytics Verilerini Sil</span>
            </button>
          </div>

          {analyticsMessage && (
            <div className={`px-4 py-3 rounded-xl text-sm ${
              analyticsMessage.includes('başarıyla') || analyticsMessage.includes('kaydedildi') || analyticsMessage.includes('saklanacak')
                ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                : 'bg-red-500/10 border border-red-500/50 text-red-400'
            }`}>
              {analyticsMessage}
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-sm text-blue-400">
              💡 <strong>İpucu:</strong> Otomatik temizlik her analytics sayfası açıldığında çalışır. 
              Manuel temizlik ile tüm geçmişi anında silebilirsiniz.
            </p>
          </div>
        </div>
      </div>

      {/* SMTP Email Settings */}
      <div className="bg-dark-card border border-gray-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <FaEnvelope className="w-5 h-5 text-orange-400" />
          <h2 className="text-xl font-bold text-white">SMTP E-posta Ayarları</h2>
        </div>

        <form onSubmit={handleSmtpSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                SMTP Sunucu
              </label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Port
              </label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
                placeholder="587"
                className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Kullanıcı Adı / E-posta
            </label>
            <input
              type="text"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              placeholder="your-email@gmail.com"
              className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Şifre / Uygulama Şifresi
            </label>
            <input
              type="password"
              value={smtpPassword}
              onChange={(e) => setSmtpPassword(e.target.value)}
              placeholder={hasSmtpPassword ? 'Kayıtlı — değiştirmek için yeni şifre girin' : '••••••••••••••••'}
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Gönderen Adı
              </label>
              <input
                type="text"
                value={smtpFromName}
                onChange={(e) => setSmtpFromName(e.target.value)}
                placeholder="Destek Ekibi"
                className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Gönderen E-posta
              </label>
              <input
                type="email"
                value={smtpFrom}
                onChange={(e) => setSmtpFrom(e.target.value)}
                placeholder="noreply@yourdomain.com"
                className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="smtpSecure"
              checked={smtpSecure}
              onChange={(e) => setSmtpSecure(e.target.checked)}
              className="w-4 h-4 bg-dark-bg border-gray-700 rounded focus:ring-orange-500"
            />
            <label htmlFor="smtpSecure" className="text-sm text-gray-300">
              SSL/TLS Kullan (Port 465 için aktif edin)
            </label>
          </div>

          {smtpMessage && (
            <div className={`px-4 py-3 rounded-xl text-sm ${
              smtpMessage.includes('kaydedildi') 
                ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                : 'bg-red-500/10 border border-red-500/50 text-red-400'
            }`}>
              {smtpMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={smtpSaving}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50"
          >
            <FaSave className="w-4 h-4" />
            <span>{smtpSaving ? 'Kaydediliyor...' : 'SMTP Ayarlarını Kaydet'}</span>
          </button>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-sm text-yellow-400">
              📧 <strong>Gmail için:</strong> &quot;Uygulama Şifresi&quot; oluşturmanız gerekir. 
              Google Hesabınız → Güvenlik → 2 Adımlı Doğrulama → Uygulama şifreleri
            </p>
          </div>
        </form>
      </div>

      {/* Email Signature Section - Separate Form */}
      <div className="bg-dark-card border border-gray-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <FaEnvelope className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-bold text-white">E-posta İmzası</h2>
        </div>
        <p className="text-sm text-gray-400 mb-6">
          Her e-postanın altında görünecek şirket bilgileri ve sosyal medya linkleri
        </p>

        <form onSubmit={handleSignatureSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Şirket/Marka Adı
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Şirketinizin Adı"
              className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Adres
            </label>
            <input
              type="text"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="880 W Maude Ave, Sunnyvale, CA, 94085"
              className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                🔗 LinkedIn URL
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/company/..."
                className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                𝕏 Twitter/X URL
              </label>
              <input
                type="url"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://twitter.com/..."
                className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                💬 Discord URL
              </label>
              <input
                type="url"
                value={discordUrl}
                onChange={(e) => setDiscordUrl(e.target.value)}
                placeholder="https://discord.gg/..."
                className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ▶️ YouTube URL
              </label>
              <input
                type="url"
                value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/@..."
              className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              📷 Instagram URL
            </label>
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🐙 GitHub URL
            </label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/..."
              className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        {signatureMessage && (
          <div className={`px-4 py-3 rounded-xl text-sm ${
            signatureMessage.includes('kaydedildi') 
              ? 'bg-green-500/10 border border-green-500/50 text-green-400'
              : 'bg-red-500/10 border border-red-500/50 text-red-400'
          }`}>
            {signatureMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={signatureSaving}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50"
        >
          <FaSave className="w-4 h-4" />
          <span>{signatureSaving ? 'Kaydediliyor...' : 'İmza Ayarlarını Kaydet'}</span>
        </button>
        </form>
      </div>
    </div>
  )
}
