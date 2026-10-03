'use client'

import { useState } from 'react'

export default function UnsubscribeForm({ email, token }: { email: string; token: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const handleClick = async () => {
    setState('loading')
    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      })
      setState(response.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return <p className="text-green-400">{email} adresi bülten listesinden çıkarıldı.</p>
  }

  return (
    <>
      <p className="text-gray-400 mb-6">
        <span className="text-white">{email}</span> adresine artık bülten gönderilmeyecek.
      </p>
      <button
        onClick={handleClick}
        disabled={state === 'loading'}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-50"
      >
        {state === 'loading' ? 'İşleniyor...' : 'Abonelikten Çık'}
      </button>
      {state === 'error' && <p className="text-red-400 text-sm mt-3">Bir hata oluştu, lütfen tekrar deneyin.</p>}
    </>
  )
}
