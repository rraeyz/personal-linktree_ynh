'use client'

import { useEffect, useState } from 'react'

// Linklerin kategorilerine göre süzme. Bloklar sunucuda çizilir; burada yalnızca
// seçili kategoride olmayanlar gizlenir (hepsi boşalan ızgara grupları da gizlenir).
export default function CategoryTabs({ categories, targetId }: { categories: string[]; targetId: string }) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const container = document.getElementById(targetId)
    if (!container) return
    container.querySelectorAll<HTMLElement>('[data-cat]').forEach((el) => {
      el.hidden = active !== null && el.dataset.cat !== active
    })
    container.querySelectorAll<HTMLElement>('[data-run]').forEach((run) => {
      const items = Array.from(run.querySelectorAll<HTMLElement>('[data-cat]'))
      run.hidden = items.length > 0 && items.every((el) => el.hidden)
    })
  }, [active, targetId])

  const tabClass = (on: boolean) =>
    `h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${
      on ? 'bg-dynamic-primary border-transparent text-white' : 'border-dynamic text-dynamic-text opacity-80 hover:opacity-100'
    }`

  return (
    <nav aria-label="Kategoriler" className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      <button type="button" aria-pressed={active === null} onClick={() => setActive(null)} className={tabClass(active === null)}>Tümü</button>
      {categories.map((category) => (
        <button key={category} type="button" aria-pressed={active === category} onClick={() => setActive(category)} className={tabClass(active === category)}>
          {category}
        </button>
      ))}
    </nav>
  )
}
