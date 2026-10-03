// Metin bloğu: başlık + paragraf (satır sonları korunur). Sunucuda çizilir.
export default function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <section className="link-card bg-dynamic-card rounded-dynamic border border-dynamic px-6 py-5 text-dynamic-text">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      {text && <p className="opacity-80 whitespace-pre-line leading-relaxed break-words">{text}</p>}
    </section>
  )
}
