'use client'

import { useEffect, useState } from 'react'

// "İstanbul · 20:14": konum ve seçilen saat dilimindeki yerel saat.
// Saat tarayıcıda hesaplanır (sunucu ile tarayıcı saati farklı olabilir; hidrasyon uyuşmazlığı olmasın).
export default function LocalTime({ location, timezone }: { location: string; timezone: string }) {
  const [time, setTime] = useState('')

  useEffect(() => {
    if (!timezone) return
    let format: Intl.DateTimeFormat
    try {
      format = new Intl.DateTimeFormat('tr-TR', { timeZone: timezone, hour: '2-digit', minute: '2-digit' })
    } catch {
      return // geçersiz saat dilimi: sadece konum görünür
    }
    const update = () => setTime(format.format(new Date()))
    update()
    const timer = setInterval(update, 30_000)
    return () => clearInterval(timer)
  }, [timezone])

  if (!location && !timezone) return null
  return (
    <span className="profile-chip opacity-90" title={timezone ? `Yerel saat (${timezone})` : undefined}>
      {location}
      {location && time ? ' · ' : ''}
      {time && <time className="tabular-nums">{time}</time>}
      {!location && !time && ' '}
    </span>
  )
}
