'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import type { IconType } from 'react-icons'

export interface PaletteCommand {
  id: string
  label: string
  hint?: string
  keywords?: string
  icon: IconType
  run: () => void
}

// Türkçe büyük/küçük harf ve noktalı/noktasız i farkı aramayı bozmasın
const normalize = (value: string) =>
  value.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '')

// Ctrl/⌘+K ile açılan arama: bölümlere git, sık işlemleri çalıştır
export default function CommandPalette({ open, onClose, commands }: { open: boolean; onClose: () => void; commands: PaletteCommand[] }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return commands
    return commands.filter((command) => normalize(`${command.label} ${command.hint || ''} ${command.keywords || ''}`).includes(q))
  }, [commands, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      // Pencere çizildikten sonra odakla
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  const runAt = (index: number) => {
    const command = results[index]
    if (!command) return
    onClose()
    command.run()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => (results.length ? (i + 1) % results.length : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      runAt(active)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-[12vh]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ara veya komut çalıştır"
        className="w-full max-w-lg bg-[#141416] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 px-4 border-b border-gray-800">
          <FaSearch className="w-4 h-4 text-gray-500 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Bölüm veya işlem ara…"
            aria-label="Ara"
            aria-controls="command-palette-list"
            aria-activedescendant={results[active] ? `command-${results[active].id}` : undefined}
            className="flex-1 h-14 bg-transparent text-white placeholder-gray-500 focus:outline-none"
          />
          <kbd className="text-xs text-gray-400 border border-gray-700 rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        <ul id="command-palette-list" ref={listRef} role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-gray-400">Sonuç yok</li>}
          {results.map((command, index) => {
            const Icon = command.icon
            return (
              <li
                key={command.id}
                id={`command-${command.id}`}
                data-index={index}
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => runAt(index)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${index === active ? 'bg-purple-500/15 text-white' : 'text-gray-300'}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${index === active ? 'text-purple-300' : 'text-gray-500'}`} aria-hidden="true" />
                <span className="flex-1 text-sm">{command.label}</span>
                {command.hint && <span className="text-xs text-gray-500">{command.hint}</span>}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
