'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FaCheck, FaChevronDown } from 'react-icons/fa'

// Tarayıcının yerel <select> listesi yerine kendi açılır menümüz.
// Neden: bazı Linux tarayıcılarında (ör. Wayland'da Chromium/Brave) yerel liste kutunun üstüne kayık açılıyor;
// fare bırakılınca altında kalan seçenek seçilip liste hemen kapanıyordu. Ayrıca yerel liste koyu temaya uymuyordu.
// Liste bir tıklamanın tamamıyla (bas + bırak) açılır, seçenek de ayrı bir tıklamayla seçilir.
// Klavye: Enter/Space/↓ açar; ↑ ↓ Home End gezinir; Enter seçer; Esc/Tab kapatır.

export interface SelectOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface SelectMenuProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  ariaLabel?: string
  id?: string
  placeholder?: string
  className?: string // tetikleyici butonun görünümü (input ile aynı sınıflar verilebilir)
  disabled?: boolean
}

const MENU_MAX_HEIGHT = 288

export default function SelectMenu({ value, onChange, options, ariaLabel, id, placeholder = 'Seçin', className = '', disabled }: SelectMenuProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [position, setPosition] = useState<{ left: number; top?: number; bottom?: number; width: number; maxHeight: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()
  const selected = options.find((option) => option.value === value)

  const place = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const below = window.innerHeight - rect.bottom - 8
    const above = rect.top - 8
    // Altta yer yoksa (ve üstte daha çok varsa) yukarı açılır
    if (below < Math.min(MENU_MAX_HEIGHT, 160) && above > below) {
      setPosition({ left: rect.left, bottom: window.innerHeight - rect.top + 4, width: rect.width, maxHeight: Math.min(MENU_MAX_HEIGHT, above) })
    } else {
      setPosition({ left: rect.left, top: rect.bottom + 4, width: rect.width, maxHeight: Math.min(MENU_MAX_HEIGHT, below) })
    }
  }, [])

  const openMenu = () => {
    if (disabled || options.length === 0) return
    setActive(Math.max(0, options.findIndex((option) => option.value === value)))
    place()
    setOpen(true)
  }
  const close = (focusButton = true) => {
    setOpen(false)
    if (focusButton) buttonRef.current?.focus()
  }
  const choose = (index: number) => {
    const option = options[index]
    if (option) onChange(option.value)
    close()
  }

  // Açıkken: dışarı tıklayınca kapanır; sayfa kayınca / boyut değişince konum güncellenir
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!buttonRef.current?.contains(target) && !listRef.current?.contains(target)) setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, place])

  // Etkin seçenek görünür kalsın
  useLayoutEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const onButtonKeyDown = (event: React.KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      openMenu()
    }
  }

  const onListKeyDown = (event: React.KeyboardEvent) => {
    const last = options.length - 1
    if (event.key === 'ArrowDown') setActive((index) => Math.min(last, index + 1))
    else if (event.key === 'ArrowUp') setActive((index) => Math.max(0, index - 1))
    else if (event.key === 'Home') setActive(0)
    else if (event.key === 'End') setActive(last)
    else if (event.key === 'Enter' || event.key === ' ') choose(active)
    else if (event.key === 'Escape') close()
    else if (event.key === 'Tab') close(false)
    else return
    if (event.key !== 'Tab') event.preventDefault()
  }

  // Liste açılınca klavye odağı listeye geçer
  useEffect(() => {
    if (open) listRef.current?.focus()
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onButtonKeyDown}
        className={`flex items-center justify-between gap-2 text-left disabled:opacity-50 ${className}`}
      >
        <span className={`flex items-center gap-2 min-w-0 truncate ${selected ? '' : 'text-gray-500'}`}>
          {selected?.icon}
          <span className="truncate">{selected?.label ?? placeholder}</span>
        </span>
        <FaChevronDown className={`w-3 h-3 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && position && createPortal(
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKeyDown}
          style={{ position: 'fixed', left: position.left, top: position.top, bottom: position.bottom, width: position.width, maxHeight: position.maxHeight }}
          className="z-[200] overflow-y-auto rounded-xl border border-gray-700 bg-[#18181b] py-1 shadow-2xl shadow-black/50 focus:outline-none"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            return (
              <li
                key={`${option.value}-${index}`}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                onPointerEnter={() => setActive(index)}
                onClick={() => choose(index)}
                className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer ${index === active ? 'bg-purple-500/20 text-white' : 'text-gray-300'}`}
              >
                {option.icon}
                <span className="flex-1 min-w-0 truncate">{option.label}</span>
                {isSelected && <FaCheck className="w-3 h-3 shrink-0 text-purple-400" aria-hidden="true" />}
              </li>
            )
          })}
        </ul>,
        document.body
      )}
    </>
  )
}
