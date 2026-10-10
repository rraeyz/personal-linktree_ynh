export interface ThemePreset {
  id: string
  name: string
  description: string
  primaryColor: string
  accentColor: string
  backgroundColor: string
  cardColor: string
  textColor: string
  buttonStyle: 'gradient' | 'solid' | 'outline' | 'glass'
  fontFamily: string
  borderRadius: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  animationSpeed: 'slow' | 'normal' | 'fast'
  // Verilmezse tema seçilince arka plan "Gradient Blur" olur
  backgroundType?: string
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'night-sky',
    name: 'Gece Gökyüzü',
    description: 'Koyu lacivert zemin, yıldızlar ve mor vurgu',
    primaryColor: '#8b5cf6',
    accentColor: '#c4b5fd',
    backgroundColor: '#07070c',
    cardColor: '#11111a',
    textColor: '#ededf5',
    buttonStyle: 'gradient',
    fontFamily: 'Sora',
    borderRadius: '2xl',
    animationSpeed: 'normal',
    backgroundType: 'stars',
  },
  {
    id: 'purple-dream',
    name: 'Purple Dream',
    description: 'Mor ve pembe tonlarında modern gradient tema',
    primaryColor: '#a855f7',
    accentColor: '#ec4899',
    backgroundColor: '#0a0a0a',
    cardColor: '#1a1a1a',
    textColor: '#ffffff',
    buttonStyle: 'gradient',
    fontFamily: 'Inter',
    borderRadius: 'xl',
    animationSpeed: 'normal',
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    description: 'Okyanus mavisi tonlarında sakin tema',
    primaryColor: '#0ea5e9',
    accentColor: '#06b6d4',
    backgroundColor: '#020617',
    cardColor: '#0f172a',
    textColor: '#f0f9ff',
    buttonStyle: 'gradient',
    fontFamily: 'Inter',
    borderRadius: 'xl',
    animationSpeed: 'normal',
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    description: 'Gün batımı tonlarında sıcak tema',
    primaryColor: '#f97316',
    accentColor: '#fb923c',
    backgroundColor: '#0c0a09',
    cardColor: '#1c1917',
    textColor: '#fff7ed',
    buttonStyle: 'gradient',
    fontFamily: 'Inter',
    borderRadius: 'xl',
    animationSpeed: 'normal',
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    description: 'Orman yeşili tonlarında doğal tema',
    primaryColor: '#10b981',
    accentColor: '#34d399',
    backgroundColor: '#022c22',
    cardColor: '#064e3b',
    textColor: '#ecfdf5',
    buttonStyle: 'gradient',
    fontFamily: 'Inter',
    borderRadius: 'xl',
    animationSpeed: 'normal',
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    description: 'Pembe ve altın tonlarında şık tema',
    primaryColor: '#f43f5e',
    accentColor: '#fb7185',
    backgroundColor: '#18181b',
    cardColor: '#27272a',
    textColor: '#fef2f2',
    buttonStyle: 'gradient',
    fontFamily: 'Inter',
    borderRadius: '2xl',
    animationSpeed: 'normal',
  },
  {
    id: 'dark-minimal',
    name: 'Dark Minimal',
    description: 'Sade ve minimalist koyu tema',
    primaryColor: '#71717a',
    accentColor: '#a1a1aa',
    backgroundColor: '#000000',
    cardColor: '#18181b',
    textColor: '#fafafa',
    buttonStyle: 'outline',
    fontFamily: 'Inter',
    borderRadius: 'lg',
    animationSpeed: 'slow',
  },
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    description: 'Neon ışıklı cyberpunk tema',
    primaryColor: '#8b5cf6',
    accentColor: '#06b6d4',
    backgroundColor: '#0c0a09',
    cardColor: '#1c1917',
    textColor: '#fafafa',
    buttonStyle: 'glass',
    fontFamily: 'Inter',
    borderRadius: 'lg',
    animationSpeed: 'fast',
  },
  {
    id: 'cotton-candy',
    name: 'Cotton Candy',
    description: 'Pastel tonlarda tatlı tema',
    primaryColor: '#c084fc',
    accentColor: '#f9a8d4',
    backgroundColor: '#1e1b4b',
    cardColor: '#312e81',
    textColor: '#faf5ff',
    buttonStyle: 'solid',
    fontFamily: 'Inter',
    borderRadius: 'full',
    animationSpeed: 'normal',
  },
]

export const FONT_FAMILIES = [
  { value: 'Inter', label: 'Inter (Modern Sans)' },
  { value: 'Poppins', label: 'Poppins (Friendly)' },
  { value: 'Montserrat', label: 'Montserrat (Elegant)' },
  { value: 'Roboto', label: 'Roboto (Clean)' },
  { value: 'Open Sans', label: 'Open Sans (Classic)' },
  { value: 'Sora', label: 'Sora (Geometrik)' },
  { value: 'Manrope', label: 'Manrope (Yumuşak)' },
]

export const BORDER_RADIUS_OPTIONS = [
  { value: 'sm', label: 'Küçük (4px)', className: 'rounded-sm' },
  { value: 'md', label: 'Orta (6px)', className: 'rounded-md' },
  { value: 'lg', label: 'Büyük (8px)', className: 'rounded-lg' },
  { value: 'xl', label: 'Çok Büyük (12px)', className: 'rounded-xl' },
  { value: '2xl', label: 'Ekstra Büyük (16px)', className: 'rounded-2xl' },
  { value: 'full', label: 'Tam Yuvarlak', className: 'rounded-full' },
]

export const BUTTON_STYLES = [
  { value: 'gradient', label: 'Gradient', icon: '🌈' },
  { value: 'solid', label: 'Solid', icon: '🎨' },
  { value: 'outline', label: 'Outline', icon: '⭕' },
  { value: 'glass', label: 'Glassmorphism', icon: '💎' },
]

export const ANIMATION_SPEEDS = [
  { value: 'slow', label: 'Yavaş', duration: '500ms' },
  { value: 'normal', label: 'Normal', duration: '300ms' },
  { value: 'fast', label: 'Hızlı', duration: '150ms' },
]

export const BACKGROUND_TYPES = [
  { 
    value: 'solid', 
    label: 'Düz Renk', 
    description: 'Tek renk arkaplan',
    icon: '🎨'
  },
  { 
    value: 'gradient-blur', 
    label: 'Gradient Blur', 
    description: 'Animasyonlu bulanık gradientler',
    icon: '🌈'
  },
  { 
    value: 'mesh-gradient', 
    label: 'Mesh Gradient', 
    description: 'Karışık gradient mesh',
    icon: '✨'
  },
  { 
    value: 'particles', 
    label: 'Parçacıklar', 
    description: 'Yüzen nokta efekti',
    icon: '⭐'
  },
 {
    value: 'stars',
    label: 'Yıldızlı Gece',
    description: 'Hafif yıldızlar ve parıltı',
    icon: '🌌'
  },
  { 
    value: 'image', 
    label: 'Özel Görsel', 
    description: 'Kendi görselinizi yükleyin',
    icon: '🖼️'
  },
]
