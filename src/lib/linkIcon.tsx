import * as FaIcons from 'react-icons/fa'
import * as SiIcons from 'react-icons/si'
import type { IconType } from 'react-icons'

// Link ikonları sunucuda çizilir: tüm Fa/Si ikon setleri (~2 MB) tarayıcıya gönderilmez,
// sadece kullanılan ikonların SVG çıktısı gider. Sadece server component'lerden çağrılmalı.
export function renderLinkIcon(iconName: string, className = 'w-5 h-5 text-dynamic-text transition-colors') {
  const allIcons = { ...FaIcons, ...SiIcons } as Record<string, IconType>
  const Icon = allIcons[iconName] || FaIcons.FaLink
  return <Icon className={className} />
}
