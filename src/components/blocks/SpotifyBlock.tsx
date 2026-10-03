// Spotify gömme: şarkı/bölüm kompakt (152px), albüm/çalma listesi/sanatçı geniş (352px)
export default function SpotifyBlock({ title, embedUrl }: { title: string; embedUrl: string }) {
  const compact = /\/embed\/(track|episode)\//.test(embedUrl)
  return (
    <section className="w-full">
      {title && <h3 className="text-sm font-medium text-dynamic-text opacity-70 mb-2 px-1">{title}</h3>}
      <iframe
        src={embedUrl}
        title={title || 'Spotify'}
        width="100%"
        height={compact ? 152 : 352}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="rounded-dynamic border-0 w-full"
      />
    </section>
  )
}
