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

const fontName = (value: string) => value.replace(/[^a-zA-Z0-9 -]/g, '') || 'Inter'

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
  font-family: '${fontName(theme.fontFamily)}', var(--font-inter, sans-serif), sans-serif;
}
`

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
