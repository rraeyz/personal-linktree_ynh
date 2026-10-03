// Ziyaretçi sayfasındaki link/blok bileşenlerinin ortak tarayıcı yardımcıları

// Tıklama takibi: ziyaretçinin geldiği yer ve sayfa URL'sindeki UTM parametreleri analytics'e yazılır
export function trackClick(linkId: number) {
  fetch(`/api/links/${linkId}/click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referrer: document.referrer, search: window.location.search }),
    keepalive: true,
  }).catch(() => {
    // İstatistik kaydı başarısız olsa da link açılır
  })
}

// Yeni sekmede aç; tarayıcı popup'ı engellerse aynı sekmede devam et
export function openUrl(target: string) {
  const opened = window.open(target, '_blank')
  if (opened) {
    opened.opener = null
  } else {
    window.location.href = target
  }
}
