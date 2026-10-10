// Metin bloğu (ör. "Hakkımda"): küçük başlık + paragraf (satır sonları korunur). Sunucuda çizilir.
export default function TextBlock({ title, text }: { title: string; text: string }) {
  if (!title && !text) return null
  return (
    <section className="site-card h-full px-5 py-5 text-dynamic-text">
      {title && <h3 className="kicker mb-2">{title}</h3>}
      {text && <p className="opacity-85 whitespace-pre-line leading-relaxed break-words">{text}</p>}
    </section>
  )
}
