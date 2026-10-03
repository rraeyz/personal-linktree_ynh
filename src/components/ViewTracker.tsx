'use client'

import { useEffect } from 'react'

// Profil sayfası görüntülenmesini bildirir: ziyaretçinin geldiği yer ve UTM parametreleriyle
export default function ViewTracker() {
  useEffect(() => {
    fetch('/api/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referrer: document.referrer, search: window.location.search }),
      keepalive: true,
    }).catch(() => {
      // İstatistik kaydı başarısız olsa da sayfa etkilenmez
    })
  }, [])

  return null
}
