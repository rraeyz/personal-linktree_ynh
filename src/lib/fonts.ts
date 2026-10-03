import { Inter, Montserrat, Open_Sans, Poppins, Roboto } from 'next/font/google'

// Tema editöründeki yazı tipleri build sırasında indirilip sunucudan servis edilir (ziyaretçi Google'a
// istek göndermez). latin-ext: Türkçe ğ, ş, ı, İ karakterleri için gerekli.
// preload kapalı: tarayıcı sadece sayfada gerçekten kullanılan fontun dosyalarını indirir.
const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter' })
const poppins = Poppins({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700'], variable: '--font-poppins', preload: false })
const montserrat = Montserrat({ subsets: ['latin', 'latin-ext'], variable: '--font-montserrat', preload: false })
const roboto = Roboto({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '700'], variable: '--font-roboto', preload: false })
const openSans = Open_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-open-sans', preload: false })

export const fontVariables = [inter, poppins, montserrat, roboto, openSans].map((font) => font.variable).join(' ')

// Profilde saklanan font adı → CSS değişkeni
export const FONT_CSS_VARS: Record<string, string> = {
  Inter: 'var(--font-inter)',
  Poppins: 'var(--font-poppins)',
  Montserrat: 'var(--font-montserrat)',
  Roboto: 'var(--font-roboto)',
  'Open Sans': 'var(--font-open-sans)',
}
