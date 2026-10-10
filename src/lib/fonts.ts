// Tema editöründeki yazı tipleri. Dosyalar npm'deki Fontsource paketlerinden gelir ve sitenin kendisinden
// servis edilir (ziyaretçi Google'a istek göndermez); @font-face tanımları app/layout.tsx'te içe aktarılır.
// Önceden next/font/google ile build sırasında Google'dan indiriliyordu; Google'ın yanıtı ara sıra next/font'u
// çökertip build'i (CI, YunoHost kurulumu ve güncellemesi) bozuyordu. Artık build Google'a bağlı değil.

// Profilde saklanan font adı → CSS değişkeni (değişkenler globals.css'te)
export const FONT_CSS_VARS: Record<string, string> = {
  Inter: 'var(--font-inter)',
  Poppins: 'var(--font-poppins)',
  Montserrat: 'var(--font-montserrat)',
  Roboto: 'var(--font-roboto)',
  'Open Sans': 'var(--font-open-sans)',
  Sora: 'var(--font-sora)',
  Manrope: 'var(--font-manrope)',
}
