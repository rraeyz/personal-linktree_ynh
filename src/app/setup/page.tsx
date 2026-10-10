'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'check' | 'initial' | 'database' | 'complete'>('check')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Form data
  const [adminUsername, setAdminUsername] = useState('admin')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [setupToken, setSetupToken] = useState('')
  const [tokenRequired, setTokenRequired] = useState(false)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [pageTitle, setPageTitle] = useState('')
  const [pageDescription, setPageDescription] = useState('')

  useEffect(() => {
    checkSetup()
    // Auto-detect base URL
    if (typeof window !== 'undefined') {
      setBaseUrl(`${window.location.protocol}//${window.location.host}`)
      // YunoHost kurulumunun sonunda verilen link: /setup?token=...
      setSetupToken(new URLSearchParams(window.location.search).get('token') || '')
    }
  }, [])

  const checkSetup = async () => {
    try {
      const response = await fetch('/api/setup')
      const data = await response.json()
      
      if (data.setupRequired) {
        setTokenRequired(!!data.tokenRequired)
        setStep(data.step)
      } else {
        router.push('/admin/login')
      }
    } catch (error) {
      setStep('initial')
    } finally {
      setLoading(false)
    }
  }

  const handleInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (adminPassword.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır')
      return
    }

    if (adminPassword !== adminPasswordConfirm) {
      setError('Şifreler eşleşmiyor')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'initial',
          data: {
            adminUsername,
            adminPassword,
            baseUrl,
            setupToken,
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        setStep('database')
      } else {
        setError(data.error || 'Kurulum başarısız')
      }
    } catch (error) {
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  const handleDatabaseSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'database',
          data: {
            name,
            bio,
            pageTitle,
            pageDescription
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        setStep('complete')
        setTimeout(() => {
          router.push('/admin/login')
        }, 2000)
      } else {
        setError(data.error || 'Veritabanı kurulumu başarısız')
      }
    } catch (error) {
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  if (loading && step === 'check') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Kontrol ediliyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🚀 İlk Kurulum
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {step === 'initial' && 'Güvenlik ayarlarını yapılandırın'}
            {step === 'database' && 'Profil bilgilerinizi girin'}
            {step === 'complete' && 'Kurulum tamamlandı!'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          <div className={`flex-1 ${step === 'initial' || step === 'database' || step === 'complete' ? 'border-blue-600' : 'border-gray-300'} border-b-2 pb-2`}>
            <span className={`text-sm ${step === 'initial' || step === 'database' || step === 'complete' ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
              1. Güvenlik
            </span>
          </div>
          <div className={`flex-1 ${step === 'database' || step === 'complete' ? 'border-blue-600' : 'border-gray-300'} border-b-2 pb-2 ml-4`}>
            <span className={`text-sm ${step === 'database' || step === 'complete' ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
              2. Profil
            </span>
          </div>
          <div className={`flex-1 ${step === 'complete' ? 'border-green-600' : 'border-gray-300'} border-b-2 pb-2 ml-4`}>
            <span className={`text-sm ${step === 'complete' ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
              3. Tamamla
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Initial Setup Form */}
        {step === 'initial' && (
          <form onSubmit={handleInitialSetup} className="space-y-6">
            {tokenRequired && (
              <div>
                <label htmlFor="setupToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kurulum Anahtarı *
                </label>
                <input
                  id="setupToken"
                  type="text"
                  value={setupToken}
                  onChange={(e) => setSetupToken(e.target.value.trim())}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono"
                  autoComplete="off"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  YunoHost kurulumunun sonunda gösterilen linkle açtıysanız otomatik dolar. Kaybettiyseniz sunucuda:{' '}
                  <code>sudo yunohost app setting kunye setup_token</code>
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Kullanıcı Adı *
              </label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="admin"
                required
                minLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Şifresi *
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="En az 8 karakter"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Şifre Tekrar *
              </label>
              <input
                type="password"
                value={adminPasswordConfirm}
                onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Şifreyi tekrar girin"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Site URL
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="http://localhost:3000 (otomatik algılandı)"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Yunohost kurulumunda bu otomatik ayarlanacak
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'İşleniyor...' : 'Devam Et →'}
            </button>
          </form>
        )}

        {/* Database Setup Form */}
        {step === 'database' && (
          <form onSubmit={handleDatabaseSetup} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                İsminiz *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Adınız Soyadınız"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Biyografi
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Kendiniz hakkında kısa bir açıklama"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sayfa Başlığı
              </label>
              <input
                type="text"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="My Link Tree"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sayfa Açıklaması
              </label>
              <input
                type="text"
                value={pageDescription}
                onChange={(e) => setPageDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="SEO için sayfa açıklaması"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Kurulum yapılıyor...' : 'Kurulumu Tamamla'}
            </button>
          </form>
        )}

        {/* Complete */}
        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Kurulum Tamamlandı!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Admin paneline yönlendiriliyorsunuz...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  )
}
