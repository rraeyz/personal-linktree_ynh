import { FONT_CSS_VARS } from '@/lib/fonts'

interface ThemeProviderProps {
  theme: {
    primaryColor: string
    accentColor: string
    backgroundColor: string
    cardColor: string
    textColor: string
    buttonStyle: string
    fontFamily: string
    borderRadius: string
    animationSpeed: string
  }
}

const radiusMap: Record<string, string> = {
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
}

const speedMap: Record<string, string> = {
  slow: '500ms',
  normal: '300ms',
  fast: '150ms',
}

// Değerler <style> içine yazıldığı için sadece geçerli renk / font adı kabul edilir
const color = (value: string, fallback: string) =>
  /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : fallback

// Bilinen fontlar build'de self-host edilen CSS değişkenine çevrilir; bilinmeyen değer Inter'e düşer
const fontStack = (value: string) => `${FONT_CSS_VARS[value] || FONT_CSS_VARS.Inter}, sans-serif`

// Tema editöründeki "Buton Stili". gradient = varsayılan kart görünümü (önceki sürümlerle aynı).
// `main .link-card` seçicisi Tailwind/global sınıflardan daha özgül olduğu için onları ezer.
const BUTTON_STYLE_CSS: Record<string, string> = {
  gradient: '',
  solid: `
main .link-card { background: var(--color-primary); border-color: transparent; }
main .link-card, main .link-card .text-dynamic-text { color: #ffffff; }
main .link-card .text-dynamic-primary, main .link-card .text-gray-500 { color: rgba(255, 255, 255, 0.85); }
main .link-card .icon-chip { color: #ffffff; background: rgba(255, 255, 255, 0.18); }`,
  outline: `
main .link-card { background: transparent; border-width: 2px; border-color: var(--color-primary); box-shadow: none; }`,
  glass: `
main .link-card { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.18); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
html.light main .link-card { background: rgba(255, 255, 255, 0.55); border-color: rgba(0, 0, 0, 0.08); }`,
}

// Tema renkleri sunucuda <style> olarak basılır: sayfa ilk boyandığında doğru renkler hazırdır.
// Koyu mod = admin panelinde seçilen tema. Açık mod (html.light) aynı primary/accent ile
// açık zemin kullanır. Sınıfı sayfa boyanmadan önce ThemeScript, sonra ThemeToggle yönetir.
export default function ThemeProvider({ theme }: ThemeProviderProps) {
  const primary = color(theme.primaryColor, '#a855f7')
  const accent = color(theme.accentColor, '#ec4899')

  const css = `
:root {
  --color-primary: ${primary};
  --color-accent: ${accent};
  --color-background: ${color(theme.backgroundColor, '#0a0a0a')};
  --color-card: ${color(theme.cardColor, '#1a1a1a')};
  --color-text: ${color(theme.textColor, '#ffffff')};
  --color-border: rgba(255, 255, 255, 0.1);
  --color-input: rgba(0, 0, 0, 0.35);
  --border-radius: ${radiusMap[theme.borderRadius] || '0.75rem'};
  --animation-duration: ${speedMap[theme.animationSpeed] || '300ms'};
  color-scheme: dark;
}
html.light {
  --color-background: #f5f5f7;
  --color-card: #ffffff;
  --color-text: #111114;
  --color-border: rgba(0, 0, 0, 0.1);
  --color-input: #f5f5f7;
  color-scheme: light;
}
@supports (color: color-mix(in srgb, red, blue)) {
  html.light {
    --color-background: color-mix(in srgb, ${primary} 6%, #f7f7f9);
  }
}
body {
  font-family: ${fontStack(theme.fontFamily)};
}
${BUTTON_STYLE_CSS[theme.buttonStyle] || ''}
`

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
