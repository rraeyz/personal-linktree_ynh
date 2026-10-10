// Spotify gömme: şarkı/bölüm kompakt (152px), albüm/çalma listesi/sanatçı geniş (352px)
export default function SpotifyBlock({ title, embedUrl }: { title: string; embedUrl: string }) {
  const compact = /\/embed\/(track|episode)\//.test(embedUrl)
  return (
    <section className="site-card w-full p-3 text-dynamic-text">
      {title && <h3 className="kicker px-1 pt-1 pb-2.5">{title}</h3>}
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
