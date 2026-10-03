'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FaHome, FaMobileAlt, FaSignOutAlt, FaUser, FaLink, FaQrcode, FaPalette, FaChartLine, FaEnvelope, FaCog, FaPaperPlane } from 'react-icons/fa'
import ProfileEditor from './ProfileEditor'
import LinksEditor from './LinksEditor'
import QRCodeGenerator from './QRCodeGenerator'
import ThemeEditor from './ThemeEditor'
import AnalyticsDashboard from './AnalyticsDashboard'
import SubscriberManagement from './SubscriberManagement'
import SettingsPanel from './SettingsPanel'
import CustomEmailPanel from './CustomEmailPanel'
import LivePreview from './LivePreview'

interface DashboardClientProps {
  initialProfile: any
  initialLinks: any[]
}

export default function DashboardClient({ initialProfile, initialLinks }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'links' | 'qr' | 'theme' | 'analytics' | 'subscribers' | 'settings' | 'custom-email'>('profile')
  const [showPreview, setShowPreview] = useState(false)
  const router = useRouter()

  // LocalStorage'dan sekmeyi ve önizleme tercihini yükle
  useEffect(() => {
    try {
      const savedTab = localStorage.getItem('dashboardActiveTab')
      if (savedTab) setActiveTab(savedTab as any)
      // Önizleme yalnızca geniş ekranda kendiliğinden açılır (dar ekranda tam ekran kaplar)
      if (localStorage.getItem('dashboardPreview') === '1' && window.matchMedia('(min-width: 1024px)').matches) {
        setShowPreview(true)
      }
    } catch {
      // localStorage kullanılamıyor
    }
  }, [])

  const togglePreview = (open: boolean) => {
    setShowPreview(open)
    try {
      localStorage.setItem('dashboardPreview', open ? '1' : '0')
    } catch {}
  }

  // Sekme değiştiğinde localStorage'a kaydet
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    localStorage.setItem('dashboardActiveTab', tab)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-card border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => togglePreview(!showPreview)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showPreview ? 'bg-purple-500/20 text-purple-300' : 'bg-dark-bg hover:bg-dark-hover text-gray-300 hover:text-white'}`}
                aria-pressed={showPreview}
              >
                <FaMobileAlt className="w-4 h-4" />
                <span>Önizleme</span>
              </button>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-dark-bg hover:bg-dark-hover rounded-lg text-gray-300 hover:text-white transition-colors"
              >
                <FaHome className="w-4 h-4" />
                <span>Siteyi Görüntüle</span>
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex gap-4 border-b border-gray-800 overflow-x-auto">
          <button
            onClick={() => handleTabChange('profile')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <FaUser className="w-4 h-4" />
            <span className="font-medium">Profil Ayarları</span>
          </button>
          <button
            onClick={() => handleTabChange('links')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'links'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <FaLink className="w-4 h-4" />
            <span className="font-medium">Link Yönetimi</span>
          </button>
          <button
            onClick={() => handleTabChange('analytics')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <FaChartLine className="w-4 h-4" />
            <span className="font-medium">Analytics</span>
          </button>
          <button
            onClick={() => handleTabChange('subscribers')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'subscribers'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <FaEnvelope className="w-4 h-4" />
            <span className="font-medium">Aboneler</span>
          </button>
          <button
            onClick={() => handleTabChange('custom-email')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'custom-email'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <FaPaperPlane className="w-4 h-4" />
            <span className="font-medium">Özel E-posta</span>
          </button>
          <button
            onClick={() => handleTabChange('qr')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'qr'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <FaQrcode className="w-4 h-4" />
            <span className="font-medium">QR Kod</span>
          </button>
          <button
            onClick={() => handleTabChange('theme')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'theme'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <FaPalette className="w-4 h-4" />
            <span className="font-medium">Tema</span>
          </button>
          <button
            onClick={() => handleTabChange('settings')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <FaCog className="w-4 h-4" />
            <span className="font-medium">Ayarlar</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${showPreview ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_375px] lg:gap-8 lg:items-start' : ''}`}>
        <div className="min-w-0">
        {activeTab === 'settings' && <SettingsPanel />}
        {activeTab === 'profile' && <ProfileEditor initialProfile={initialProfile} />}
        {activeTab === 'links' && <LinksEditor initialLinks={initialLinks} />}
        {activeTab === 'analytics' && <AnalyticsDashboard links={initialLinks} />}
        {activeTab === 'subscribers' && <SubscriberManagement />}
        {activeTab === 'custom-email' && <CustomEmailPanel />}
        {activeTab === 'qr' && (
          <QRCodeGenerator 
            url={typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com'} 
            title="Link Tree QR Kod"
          />
        )}
        {activeTab === 'theme' && <ThemeEditor initialProfile={initialProfile} />}
        </div>
        {showPreview && <LivePreview onClose={() => togglePreview(false)} />}
      </div>
    </main>
  )
}
