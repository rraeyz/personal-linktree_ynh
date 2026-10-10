'use client'

import { useEffect, useState } from 'react'
import { FaArrowRight } from 'react-icons/fa'
import { openUrl, trackClick } from '@/lib/clientLinks'

interface CountdownBlockProps {
  linkId: number
  title: string
  description: string
  targetDate: string // ISO
  url: string
}

function remaining(target: number) {
  const diff = Math.max(0, target - Date.now())
  return {
    done: diff === 0,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

// Geri sayım: süre sunucuda değil tarayıcıda hesaplanır (hydration uyuşmazlığı olmasın diye ilk çizimde "--")
export default function CountdownBlock({ linkId, title, description, targetDate, url }: CountdownBlockProps) {
  const target = new Date(targetDate).getTime()
  const [time, setTime] = useState<ReturnType<typeof remaining> | null>(null)

  useEffect(() => {
    setTime(remaining(target))
    const timer = setInterval(() => setTime(remaining(target)), 1000)
    return () => clearInterval(timer)
  }, [target])

  const units: Array<[string, number | undefined]> = [
    ['gün', time?.days],
    ['saat', time?.hours],
    ['dakika', time?.minutes],
    ['saniye', time?.seconds],
  ]

  return (
    <section className="site-card h-full px-5 py-5 text-dynamic-text">
      {title && <h3 className="kicker">{title}</h3>}
      {description && <p className="opacity-80 mt-1.5 whitespace-pre-line">{description}</p>}
      {time?.done ? (
        <p className="mt-4 text-xl font-semibold text-dynamic-primary">Başladı!</p>
      ) : (
        <div className="mt-4 grid grid-cols-4 gap-2" aria-live="off">
          {units.map(([label, value]) => (
            <div key={label} className="rounded-dynamic bg-dynamic-input py-2.5 text-center">
              <div className="text-2xl font-semibold tabular-nums">{value === undefined ? '--' : String(value).padStart(2, '0')}</div>
              <div className="text-xs opacity-70">{label}</div>
            </div>
          ))}
        </div>
      )}
      {url && (
        <button
          type="button"
          onClick={() => { trackClick(linkId); openUrl(url) }}
          className="mt-4 inline-flex items-center gap-2 font-semibold text-dynamic-primary hover:opacity-80"
        >
          Detaylar <FaArrowRight className="w-3 h-3" />
        </button>
      )}
    </section>
  )
}
