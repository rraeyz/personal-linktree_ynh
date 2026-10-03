'use client'

import { FaArrowRight } from 'react-icons/fa'
import { openUrl, trackClick } from '@/lib/clientLinks'

interface PortfolioCardProps {
  linkId: number
  title: string
  description: string
  image: string
  url: string
  featured?: boolean
}

// Portfolyo/proje kartı: görsel + başlık + açıklama; link verilmişse kartın tamamı tıklanır
export default function PortfolioCard({ linkId, title, description, image, url, featured = false }: PortfolioCardProps) {
  const clickable = !!url
  const content = (
    <>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="w-full aspect-video object-cover" loading="lazy" />
      )}
      <div className="px-5 py-4 text-left">
        <div className="flex items-center justify-between gap-3">
          <h3 className={`${featured ? 'text-xl' : 'text-lg'} font-semibold text-dynamic-text`}>{title}</h3>
          {clickable && <FaArrowRight className="w-4 h-4 shrink-0 text-gray-500 group-hover:text-[color:var(--color-primary)] transition-colors" />}
        </div>
        {description && <p className="mt-1 text-sm text-dynamic-text opacity-75 line-clamp-3 whitespace-pre-line">{description}</p>}
      </div>
    </>
  )
  const className = `group link-card block w-full h-full overflow-hidden bg-dynamic-card rounded-dynamic border border-dynamic shadow-lg transition-all ${featured ? 'featured-card' : ''} ${clickable ? 'hover:-translate-y-0.5 hover:border-dynamic-primary' : ''}`

  if (!clickable) return <article className={className}>{content}</article>
  return (
    <a
      href={url}
      rel="noopener noreferrer"
      onClick={(e) => { e.preventDefault(); trackClick(linkId); openUrl(url) }}
      className={className}
    >
      {content}
    </a>
  )
}
