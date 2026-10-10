'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaPalette, FaSave, FaUndo } from 'react-icons/fa'
import { THEME_PRESETS, FONT_FAMILIES, BORDER_RADIUS_OPTIONS, BUTTON_STYLES, ANIMATION_SPEEDS, BACKGROUND_TYPES } from '@/lib/themes'
import ImageUploadButton from './ImageUploadButton'

interface ThemeEditorProps {
  initialProfile: any
}

export default function ThemeEditor({ initialProfile }: ThemeEditorProps) {
  const [selectedPreset, setSelectedPreset] = useState(initialProfile?.themePreset || 'purple-dream')
  const [primaryColor, setPrimaryColor] = useState(initialProfile?.primaryColor || '#a855f7')
  const [accentColor, setAccentColor] = useState(initialProfile?.accentColor || '#ec4899')
  const [backgroundColor, setBackgroundColor] = useState(initialProfile?.backgroundColor || '#0a0a0a')
  const [cardColor, setCardColor] = useState(initialProfile?.cardColor || '#1a1a1a')
  const [textColor, setTextColor] = useState(initialProfile?.textColor || '#ffffff')
  const [buttonStyle, setButtonStyle] = useState(initialProfile?.buttonStyle || 'gradient')
  const [fontFamily, setFontFamily] = useState(initialProfile?.fontFamily || 'Inter')
  const [borderRadius, setBorderRadius] = useState(initialProfile?.borderRadius || 'xl')
  const [animationSpeed, setAnimationSpeed] = useState(initialProfile?.animationSpeed || 'normal')
  const [backgroundType, setBackgroundType] = useState(initialProfile?.backgroundType || 'gradient-blur')
  const [backgroundImage, setBackgroundImage] = useState(initialProfile?.backgroundImage || '')
  const [backgroundOpacity, setBackgroundOpacity] = useState(initialProfile?.backgroundOpacity || 100)
  const [layout, setLayout] = useState<string>(initialProfile?.layout || 'classic')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const applyPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId)
    if (preset) {
      setSelectedPreset(preset.id)
      setPrimaryColor(preset.primaryColor)
      setAccentColor(preset.accentColor)
      setBackgroundColor(preset.backgroundColor)
      setCardColor(preset.cardColor)
      setTextColor(preset.textColor)
      setButtonStyle(preset.buttonStyle)
      setFontFamily(preset.fontFamily)
      setBorderRadius(preset.borderRadius)
      setAnimationSpeed(preset.animationSpeed)
      setBackgroundType(preset.backgroundType || 'gradient-blur')
      setBackgroundImage('')
      setBackgroundOpacity(100)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themePreset: selectedPreset,
          primaryColor,
          accentColor,
          backgroundColor,
          cardColor,
          textColor,
          buttonStyle,
          fontFamily,
          borderRadius,
          animationSpeed,
          backgroundType,
          backgroundImage,
          backgroundOpacity,
          layout,
        }),
      })

      if (!response.ok) {
        throw new Error('Kayıt başarısız')
      }

      setMessage('Tema başarıyla kaydedildi!')
      router.refresh()
      
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefault = () => {
    applyPreset('purple-dream')
    setBackgroundType('gradient-blur')
    setBackgroundImage('')
    setBackgroundOpacity(100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <FaPalette className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Tema Özelleştirme</h2>
            <p className="text-sm text-gray-400">Sitenizin görünümünü özelleştirin</p>
          </div>
        </div>
        <button
          onClick={resetToDefault}
          className="flex items-center gap-2 px-4 py-2 bg-dark-bg hover:bg-dark-hover rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <FaUndo className="w-4 h-4" />
          Sıfırla
        </button>
      </div>

      {/* Sayfa Düzeni */}
      <div className="p-6 bg-dark-card rounded-xl border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-1">Sayfa Düzeni</h3>
        <p className="text-sm text-gray-400 mb-4">Linklerin nasıl görüneceği. Blokların sırasını Linkler ve Bloklar bölümünden değiştirirsin; geniş ekranda profil kartı solda, bloklar sağda durur.</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'classic', label: 'Satırlar', description: 'Linkler ikon + başlık satırları (geniş ekranda ikişerli)' },
            { value: 'grid', label: 'Kutular', description: 'Linkler telefonda da ikişerli kutu; görseli olan linkte görsel üstte' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setLayout(option.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                layout === option.value ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:border-gray-600 bg-dark-bg'
              }`}
            >
              <div className="flex gap-1 mb-3" aria-hidden="true">
                {option.value === 'classic' ? (
                  <div className="w-full space-y-1">{[0, 1, 2].map((i) => <div key={i} className="h-2 rounded bg-gray-600" />)}</div>
                ) : (
                  <div className="w-full grid grid-cols-2 gap-1">{[0, 1, 2, 3].map((i) => <div key={i} className={`h-4 rounded bg-gray-600 ${i === 0 ? 'col-span-2 h-2' : ''}`} />)}</div>
                )}
              </div>
              <div className="text-sm font-medium text-white">{option.label}</div>
              <div className="text-xs text-gray-500 mt-1">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Hazır Temalar */}
      <div className="p-6 bg-dark-card rounded-xl border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Hazır Temalar</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedPreset === preset.id
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700 hover:border-gray-600 bg-dark-bg'
              }`}
            >
              <div className="flex gap-2 mb-3">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: preset.primaryColor }}
                />
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: preset.accentColor }}
                />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">{preset.name}</h4>
              <p className="text-xs text-gray-400">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Renk Özelleştirme */}
      <div className="p-6 bg-dark-card rounded-xl border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Renk Paleti</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Ana Renk</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-700 cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Vurgu Rengi</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-700 cursor-pointer"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="flex-1 px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Arkaplan</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-700 cursor-pointer"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="flex-1 px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Kart Rengi</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={cardColor}
                onChange={(e) => setCardColor(e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-700 cursor-pointer"
              />
              <input
                type="text"
                value={cardColor}
                onChange={(e) => setCardColor(e.target.value)}
                className="flex-1 px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Metin Rengi</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-700 cursor-pointer"
              />
              <input
                type="text"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="flex-1 px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stil Ayarları */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Buton Stili */}
        <div className="p-6 bg-dark-card rounded-xl border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Buton Stili</h3>
          <div className="grid grid-cols-2 gap-3">
            {BUTTON_STYLES.map((style) => (
              <button
                key={style.value}
                onClick={() => setButtonStyle(style.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  buttonStyle === style.value
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 hover:border-gray-600 bg-dark-bg'
                }`}
              >
                <div className="text-2xl mb-2">{style.icon}</div>
                <div className="text-sm font-medium text-white">{style.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Font Ailesi */}
        <div className="p-6 bg-dark-card rounded-xl border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Font Ailesi</h3>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg text-white"
          >
            {FONT_FAMILIES.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Border Radius & Animation */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 bg-dark-card rounded-xl border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Köşe Yuvarlaklığı</h3>
          <div className="grid grid-cols-3 gap-2">
            {BORDER_RADIUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setBorderRadius(option.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  borderRadius === option.value
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 hover:border-gray-600 bg-dark-bg'
                }`}
              >
                <div className="text-xs text-center text-white">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 bg-dark-card rounded-xl border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Animasyon Hızı</h3>
          <div className="grid grid-cols-3 gap-2">
            {ANIMATION_SPEEDS.map((speed) => (
              <button
                key={speed.value}
                onClick={() => setAnimationSpeed(speed.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  animationSpeed === speed.value
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 hover:border-gray-600 bg-dark-bg'
                }`}
              >
                <div className="text-xs text-center text-white">{speed.label}</div>
                <div className="text-xs text-center text-gray-400 mt-1">{speed.duration}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Arkaplan Ayarları */}
      <div className="p-6 bg-dark-card rounded-xl border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Arkaplan Türü</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {BACKGROUND_TYPES.map((bg) => (
            <button
              key={bg.value}
              onClick={() => setBackgroundType(bg.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                backgroundType === bg.value
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700 hover:border-gray-600 bg-dark-bg'
              }`}
            >
              <div className="text-2xl mb-2">{bg.icon}</div>
              <div className="text-xs font-medium text-white mb-1">{bg.label}</div>
              <div className="text-xs text-gray-400">{bg.description}</div>
            </button>
          ))}
        </div>

        {/* Arkaplan Görseli (sadece image seçiliyse) */}
        {backgroundType === 'image' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Arkaplan Görseli</label>
              <div className="mb-2">
                <ImageUploadButton kind="background" onUploaded={setBackgroundImage} label="Görsel Yükle" />
              </div>
              <input
                type="text"
                value={backgroundImage}
                onChange={(e) => setBackgroundImage(e.target.value)}
                placeholder="https://example.com/background.jpg"
                className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Görsel Opaklığı: {backgroundOpacity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={backgroundOpacity}
                onChange={(e) => setBackgroundOpacity(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mesaj & Kaydet */}
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
        onClick={handleSave}
        disabled={saving}
        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FaSave className="w-4 h-4" />
        <span>{saving ? 'Kaydediliyor...' : 'Temayı Kaydet'}</span>
      </button>
    </div>
  )
}
