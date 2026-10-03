'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaPlus, FaTrash, FaTimes, FaGripVertical, FaSave, FaChartBar, FaFolder, FaEdit, FaLock, FaClock, FaStar } from 'react-icons/fa'
import ScheduleStatus from '@/components/ScheduleStatus'
import ImageUploadButton from './ImageUploadButton'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface LinksEditorProps {
  initialLinks: any[]
}

const popularIcons = [
  { name: 'FaGithub', label: 'GitHub' },
  { name: 'FaTwitter', label: 'Twitter/X' },
  { name: 'FaLinkedin', label: 'LinkedIn' },
  { name: 'FaInstagram', label: 'Instagram' },
  { name: 'FaYoutube', label: 'YouTube' },
  { name: 'FaGlobe', label: 'Website' },
  { name: 'FaEnvelope', label: 'Email' },
  { name: 'FaDiscord', label: 'Discord' },
  { name: 'SiTelegram', label: 'Telegram' },
  { name: 'FaMedium', label: 'Medium' },
  { name: 'FaLink', label: 'Link' },
  { name: 'FaDonate', label: 'Bağış' },
  { name: 'FaPhone', label: 'Telefon' },
  { name: 'FaMapMarkerAlt', label: 'Konum' },
  { name: 'FaCalendarAlt', label: 'Etkinlik' },
  { name: 'FaFileAlt', label: 'Dosya' },
  { name: 'FaMusic', label: 'Müzik' },
  { name: 'FaVideo', label: 'Video' },
  { name: 'FaGamepad', label: 'Oyun' },
  { name: 'FaCamera', label: 'Fotoğraf' },
  { name: 'FaBook', label: 'Kitap' },
  { name: 'FaHeart', label: 'Favori' },
  { name: 'FaStar', label: 'Yıldız' },
  { name: 'FaShoppingCart', label: 'Mağaza' },
  { name: 'FaUser', label: 'Kullanıcı' },
  { name: 'FaUsers', label: 'Topluluk' },
  { name: 'FaCode', label: 'Kod' },
  { name: 'FaCogs', label: 'Ayarlar' },
  { name: 'FaCloud', label: 'Bulut' },
]

const linkCategories = [
  'Sosyal Medya',
  'İş & Kariyer',
  'Projeler',
  'İletişim',
  'Blog & Yazılar',
  'Video & Podcast',
  'Diğer'
]


// Blok tipleri (gruplu). fields: formda gösterilecek alanlar
type Field = 'url' | 'urlOptional' | 'icon' | 'thumbnail' | 'featured' | 'password' | 'slug' | 'description' | 'images' | 'targetDate'

const linkTypes: Array<{ value: string; label: string; icon: string; description: string; group: string; fields: Field[] }> = [
  { value: 'link', label: 'Normal Link', icon: 'FaLink', description: 'Başka sayfaya yönlendir', group: 'Linkler', fields: ['url', 'icon', 'thumbnail', 'featured', 'password', 'slug'] },
  { value: 'contact', label: 'Bana Ulaşın', icon: 'FaEnvelope', description: 'İletişim formu aç', group: 'Linkler', fields: ['icon', 'featured'] },
  { value: 'donation', label: 'Bağış Yap', icon: 'FaDonate', description: 'Bağış sayfasına git', group: 'Linkler', fields: ['url', 'icon', 'thumbnail', 'featured', 'password', 'slug'] },
  { value: 'text', label: 'Metin', icon: 'FaAlignLeft', description: 'Başlık ve paragraf', group: 'İçerik', fields: ['description'] },
  { value: 'portfolio', label: 'Portfolyo Kartı', icon: 'FaBriefcase', description: 'Görsel + açıklama', group: 'İçerik', fields: ['urlOptional', 'thumbnail', 'description', 'featured'] },
  { value: 'countdown', label: 'Geri Sayım', icon: 'FaHourglassHalf', description: 'Etkinliğe kalan süre', group: 'İçerik', fields: ['targetDate', 'description', 'urlOptional'] },
  { value: 'gallery', label: 'Galeri', icon: 'FaImages', description: 'Fotoğraf ızgarası', group: 'Medya', fields: ['images'] },
  { value: 'spotify', label: 'Spotify', icon: 'FaSpotify', description: 'Şarkı / çalma listesi', group: 'Medya', fields: ['url'] },
  { value: 'embed-youtube', label: 'YouTube', icon: 'FaYoutube', description: 'Video göm', group: 'Medya', fields: ['url'] },
  { value: 'embed-twitter', label: 'X (Twitter)', icon: 'FaTwitter', description: 'Gönderi göm', group: 'Medya', fields: ['url'] },
  { value: 'embed-instagram', label: 'Instagram', icon: 'FaInstagram', description: 'Gönderi göm', group: 'Medya', fields: ['url'] },
]

const typeInfo = (type: string) => linkTypes.find((t) => t.value === type) || linkTypes[0]

const URL_PLACEHOLDERS: Record<string, string> = {
  spotify: 'https://open.spotify.com/playlist/...',
  'embed-youtube': 'https://www.youtube.com/watch?v=...',
  'embed-twitter': 'https://x.com/kullanici/status/...',
  'embed-instagram': 'https://www.instagram.com/p/...',
}

// Icon renderer helper
const getIconComponent = (iconName: string) => {
  const allIcons = { ...require('react-icons/fa'), ...require('react-icons/si') } as any
  return allIcons[iconName] || allIcons['FaLink']
}

// datetime-local alanı yerel saat ister; veritabanı UTC tutar. İki yönde de doğru çevir
// (önceden UTC değer yerel saatmiş gibi gösteriliyor, her düzenlemede saat kayıyordu).
const toLocalInput = (value: string | Date | null | undefined) => {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null)

type FormData = {
  title: string
  url: string
  icon: string
  customIconUrl: string
  useCustomIcon: boolean
  category: string
  type: string
  password: string
  passwordHint: string
  hasExistingPassword: boolean
  removePassword: boolean
  slug: string
  startDate: string
  endDate: string
  featured: boolean
  thumbnail: string
  description: string
  images: string[]
  targetDate: string
}

const emptyForm = (): FormData => ({
  title: '', url: '', icon: 'FaLink', customIconUrl: '', useCustomIcon: false, category: '', type: 'link',
  password: '', passwordHint: '', hasExistingPassword: false, removePassword: false, slug: '',
  startDate: '', endDate: '', featured: false, thumbnail: '', description: '', images: [], targetDate: '',
})

const formFromLink = (link: any): FormData => {
  let images: string[] = []
  try { images = JSON.parse(link.images || '[]') } catch {}
  const customIcon = (link.icon || '').startsWith('http')
  return {
    title: link.title || '',
    url: link.url || '',
    icon: customIcon ? 'FaLink' : link.icon || 'FaLink',
    customIconUrl: customIcon ? link.icon : '',
    useCustomIcon: customIcon,
    category: link.category || '',
    type: link.type || 'link',
    password: '', // mevcut şifre (hash) forma konmaz
    passwordHint: link.passwordHint || '',
    hasExistingPassword: !!link.password,
    removePassword: false,
    slug: link.slug || '',
    startDate: toLocalInput(link.startDate),
    endDate: toLocalInput(link.endDate),
    featured: !!link.featured,
    thumbnail: link.thumbnail || '',
    description: link.description || '',
    images: Array.isArray(images) ? images : [],
    targetDate: toLocalInput(link.targetDate),
  }
}

// Formdan API gövdesi. Düzenlemede şifre: boş = değişmez, "kaldır" = korumayı kaldır.
const payloadFromForm = (form: FormData, mode: 'add' | 'edit') => {
  const fields = typeInfo(form.type).fields
  const body: Record<string, any> = {
    title: form.title,
    type: form.type,
    category: form.category,
    url: fields.includes('url') || fields.includes('urlOptional') ? form.url : '',
    icon: form.useCustomIcon && form.customIconUrl ? form.customIconUrl : form.icon,
    startDate: fromLocalInput(form.startDate),
    endDate: fromLocalInput(form.endDate),
    featured: fields.includes('featured') ? form.featured : false,
    thumbnail: fields.includes('thumbnail') ? form.thumbnail : '',
    description: fields.includes('description') ? form.description : '',
    images: fields.includes('images') ? form.images : [],
    targetDate: fields.includes('targetDate') ? fromLocalInput(form.targetDate) : null,
    slug: fields.includes('slug') ? form.slug : '',
    passwordHint: form.passwordHint,
  }
  if (!fields.includes('password')) {
    body.password = ''
  } else if (mode === 'add') {
    body.password = form.password
  } else if (form.removePassword) {
    body.password = ''
  } else if (form.password) {
    body.password = form.password
  }
  return body
}

const inputClass = 'w-full px-4 py-2 bg-dark-card border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500'
const labelClass = 'block text-sm font-medium text-gray-300 mb-2'

// Ekleme ve düzenleme formunun ortak alanları
function LinkFormFields({ form, setForm, mode }: { form: FormData; setForm: (f: FormData) => void; mode: 'add' | 'edit' }) {
  const info = typeInfo(form.type)
  const has = (field: Field) => info.fields.includes(field)
  const set = (patch: Partial<FormData>) => setForm({ ...form, ...patch })
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  const fetchPreview = async () => {
    setPreviewError('')
    setPreviewLoading(true)
    try {
      const response = await fetch('/api/admin/link-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.url }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Önizleme alınamadı')
      set({ thumbnail: data.url })
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Önizleme alınamadı')
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Tip seçimi */}
      <div>
        <label className={labelClass}>Blok Türü</label>
        {['Linkler', 'İçerik', 'Medya'].map((group) => (
          <div key={group} className="mb-3">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">{group}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {linkTypes.filter((t) => t.group === group).map((linkType) => {
                const IconComponent = getIconComponent(linkType.icon)
                return (
                  <button
                    key={linkType.value}
                    type="button"
                    onClick={() => set({ type: linkType.value })}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      form.type === linkType.value ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:border-gray-600 bg-dark-card'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 text-purple-400 mb-1" />
                    <div className="text-xs font-medium text-white">{linkType.label}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{linkType.description}</div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className={labelClass}>Başlık</label>
        <input type="text" value={form.title} onChange={(e) => set({ title: e.target.value })} className={inputClass} placeholder={form.type === 'text' ? 'Hakkımda' : 'GitHub Profilim'} />
      </div>

      {(has('url') || has('urlOptional')) && (
        <div>
          <label className={labelClass}>{has('url') ? 'URL' : 'Link (opsiyonel)'}</label>
          <input type="url" value={form.url} onChange={(e) => set({ url: e.target.value })} className={inputClass} placeholder={URL_PLACEHOLDERS[form.type] || 'https://...'} />
        </div>
      )}

      {has('description') && (
        <div>
          <label className={labelClass}>{form.type === 'text' ? 'Metin' : 'Açıklama'}</label>
          <textarea value={form.description} onChange={(e) => set({ description: e.target.value })} rows={form.type === 'text' ? 5 : 3} className={`${inputClass} resize-y`} placeholder={form.type === 'text' ? 'Kendinizden veya duyurunuzdan bahsedin...' : 'Kısa açıklama'} />
        </div>
      )}

      {has('targetDate') && (
        <div>
          <label className={labelClass}>Hedef tarih ve saat</label>
          <input type="datetime-local" value={form.targetDate} onChange={(e) => set({ targetDate: e.target.value })} className={inputClass} />
        </div>
      )}

      {has('images') && (
        <div>
          <label className={labelClass}>Galeri görselleri ({form.images.length}/24)</label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {form.images.map((src, index) => (
              <div key={src + index} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full aspect-square object-cover rounded-lg border border-gray-700" />
                <div className="absolute inset-x-0 bottom-0 flex justify-between p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" disabled={index === 0} onClick={() => { const images = [...form.images]; [images[index - 1], images[index]] = [images[index], images[index - 1]]; set({ images }) }} className="px-2 py-1 text-xs bg-black/70 text-white rounded disabled:opacity-30" aria-label="Sola taşı">←</button>
                  <button type="button" onClick={() => set({ images: form.images.filter((_, i) => i !== index) })} className="px-2 py-1 text-xs bg-red-600/90 text-white rounded" aria-label="Kaldır"><FaTrash className="w-3 h-3" /></button>
                  <button type="button" disabled={index === form.images.length - 1} onClick={() => { const images = [...form.images]; [images[index + 1], images[index]] = [images[index], images[index + 1]]; set({ images }) }} className="px-2 py-1 text-xs bg-black/70 text-white rounded disabled:opacity-30" aria-label="Sağa taşı">→</button>
                </div>
              </div>
            ))}
          </div>
          {form.images.length < 24 && (
            <ImageUploadButton kind="gallery" label="Görsel Ekle" onUploaded={(url) => setForm({ ...form, images: [...form.images, url] })} />
          )}
        </div>
      )}

      {has('thumbnail') && (
        <div>
          <label className={labelClass}>{form.type === 'portfolio' ? 'Kart görseli' : 'Önizleme görseli (opsiyonel)'}</label>
          {form.thumbnail && (
            <div className="relative mb-2 w-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.thumbnail} alt="" className="w-48 aspect-video object-cover rounded-lg border border-gray-700" />
              <button type="button" onClick={() => set({ thumbnail: '' })} className="absolute top-1 right-1 p-1.5 bg-black/70 text-white rounded" aria-label="Görseli kaldır"><FaTimes className="w-3 h-3" /></button>
            </div>
          )}
          <div className="flex flex-wrap items-start gap-2">
            <ImageUploadButton kind="thumb" label="Görsel Yükle" onUploaded={(url) => set({ thumbnail: url })} />
            {form.url && form.type !== 'portfolio' && (
              <button type="button" onClick={fetchPreview} disabled={previewLoading} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg disabled:opacity-60">
                {previewLoading ? 'Alınıyor...' : 'Siteden otomatik al'}
              </button>
            )}
          </div>
          {previewError && <p className="text-xs text-red-400 mt-1">{previewError}</p>}
        </div>
      )}

      {has('icon') && (
        <div>
          <label className={labelClass}>İkon</label>
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => set({ useCustomIcon: false })} className={`flex-1 px-3 py-2 rounded-lg text-sm ${!form.useCustomIcon ? 'bg-purple-500 text-white' : 'bg-dark-card text-gray-400'}`}>Hazır ikon</button>
            <button type="button" onClick={() => set({ useCustomIcon: true })} className={`flex-1 px-3 py-2 rounded-lg text-sm ${form.useCustomIcon ? 'bg-purple-500 text-white' : 'bg-dark-card text-gray-400'}`}>Özel ikon (URL)</button>
          </div>
          {!form.useCustomIcon ? (
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400">
                {(() => { const IconComponent = getIconComponent(form.icon); return <IconComponent className="w-5 h-5" /> })()}
              </div>
              <select value={form.icon} onChange={(e) => set({ icon: e.target.value })} className={`${inputClass} pl-12`}>
                {popularIcons.map((icon) => <option key={icon.name} value={icon.name}>{icon.label}</option>)}
              </select>
            </div>
          ) : (
            <input type="url" value={form.customIconUrl} onChange={(e) => set({ customIconUrl: e.target.value })} className={inputClass} placeholder="https://example.com/icon.png" />
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Kategori (opsiyonel)</label>
          <select value={form.category} onChange={(e) => set({ category: e.target.value })} className={inputClass}>
            <option value="">Kategorisiz</option>
            {linkCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        {has('slug') && (
          <div>
            <label className={labelClass}>Kısa link (opsiyonel)</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">/go/</span>
              <input type="text" value={form.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className={inputClass} placeholder="github" />
            </div>
          </div>
        )}
      </div>

      {has('featured') && (
        <label className="flex items-start gap-3 p-3 bg-dark-card border border-gray-700 rounded-lg cursor-pointer">
          <input type="checkbox" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} className="mt-1 w-4 h-4 accent-purple-500" />
          <span>
            <span className="flex items-center gap-2 text-sm font-medium text-white"><FaStar className="w-3 h-3 text-yellow-400" /> Öne çıkar</span>
            <span className="block text-xs text-gray-400 mt-0.5">Daha büyük ve animasyonlu çerçeveyle gösterilir; ızgara düzeninde tam genişlik kaplar.</span>
          </span>
        </label>
      )}

      {has('password') && (
        <div className="p-4 bg-dark-card rounded-lg border border-gray-700 space-y-3">
          <div className="flex items-center gap-2"><FaLock className="w-4 h-4 text-purple-400" /><h4 className="text-sm font-semibold text-white">Şifre koruması</h4></div>
          {mode === 'edit' && form.hasExistingPassword && (
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={form.removePassword} onChange={(e) => set({ removePassword: e.target.checked })} className="accent-purple-500" />
              Şifre korumasını kaldır
            </label>
          )}
          {!form.removePassword && (
            <>
              <input
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => set({ password: e.target.value })}
                className={inputClass}
                placeholder={mode === 'edit' && form.hasExistingPassword ? 'Şifreli. Değiştirmek için yeni şifre girin (boş = aynı kalır)' : 'Boş bırakılırsa korumasız'}
              />
              {(form.password || form.hasExistingPassword) && (
                <input type="text" value={form.passwordHint} onChange={(e) => set({ passwordHint: e.target.value })} className={inputClass} placeholder="Şifre ipucu (opsiyonel)" />
              )}
            </>
          )}
        </div>
      )}

      <div className="p-4 bg-dark-card rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 mb-3"><FaClock className="w-4 h-4 text-purple-400" /><h4 className="text-sm font-semibold text-white">Zamanlama (opsiyonel)</h4></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Başlangıç</label>
            <input type="datetime-local" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Bitiş</label>
            <input type="datetime-local" value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} className={inputClass} />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Blok sadece bu tarihler arasında gösterilir</p>
      </div>
    </div>
  )
}

// Sortable Link Item Component
function SortableLinkItem({ link, onToggle, onDelete, onEdit }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  const now = new Date()
  const isScheduled = !!(link.startDate || link.endDate)
  const isNotYetActive = link.startDate && new Date(link.startDate) > now
  const isExpired = link.endDate && new Date(link.endDate) < now
  const info = typeInfo(link.type)
  const TypeIcon = getIconComponent(info.icon)
  const isLinkLike = ['link', 'donation', 'contact'].includes(link.type)

  let subtitle = link.url
  if (link.type === 'text') subtitle = link.description
  if (link.type === 'gallery') { try { subtitle = `${JSON.parse(link.images || '[]').length} görsel` } catch { subtitle = '' } }
  if (link.type === 'countdown') subtitle = link.targetDate ? new Date(link.targetDate).toLocaleString('tr-TR') : 'Tarih yok'
  if (link.type === 'contact') subtitle = 'İletişim formu'

  return (
    <div ref={setNodeRef} style={style} className={`p-4 bg-dark-bg rounded-xl border ${link.featured ? 'border-yellow-500/40' : 'border-gray-700'} ${!link.enabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-4">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing" aria-label="Sürükle">
          <FaGripVertical className="text-gray-600" />
        </div>

        {link.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={link.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="p-2 bg-purple-500/10 rounded-lg shrink-0">
            {isLinkLike && (link.icon || '').startsWith('http') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={link.icon} alt="" className="w-5 h-5 object-contain" />
            ) : (
              (() => { const IconComponent = isLinkLike ? getIconComponent(link.icon) : TypeIcon; return <IconComponent className="w-5 h-5 text-purple-400" /> })()
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-white font-medium">{link.title}</h3>
            <span className="px-2 py-0.5 bg-gray-700/60 text-gray-300 text-xs rounded-full flex items-center gap-1"><TypeIcon className="w-3 h-3" />{info.label}</span>
            {link.featured && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1"><FaStar className="w-3 h-3" />Öne çıkan</span>}
            {link.category && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1"><FaFolder className="w-3 h-3" />{link.category}</span>}
            {link.password && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1"><FaLock className="w-3 h-3" />Şifreli</span>}
            {isScheduled && (
              <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${isNotYetActive ? 'bg-orange-500/20 text-orange-400' : isExpired ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                <FaClock className="w-3 h-3" />{isNotYetActive ? 'Bekliyor' : isExpired ? 'Dolmuş' : 'Zamanlanmış'}
              </span>
            )}
            {link.slug && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">/go/{link.slug}</span>}
            {link.clicks > 0 && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1"><FaChartBar className="w-3 h-3" />{link.clicks} tıklama</span>}
          </div>
          {subtitle && <p className="text-sm text-gray-400 mt-1 truncate">{subtitle}</p>}
          {isScheduled && <div className="mt-2"><ScheduleStatus startDate={link.startDate} endDate={link.endDate} /></div>}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(link)} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors" aria-label="Düzenle"><FaEdit className="w-4 h-4" /></button>
          <button onClick={() => onToggle(link.id, link.enabled)} className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${link.enabled ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>{link.enabled ? 'Aktif' : 'Pasif'}</button>
          <button onClick={() => onDelete(link.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors" aria-label="Sil"><FaTrash className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  )
}

export default function LinksEditor({ initialLinks }: LinksEditorProps) {
  const [links, setLinks] = useState(initialLinks)
  const [mode, setMode] = useState<'closed' | 'add' | 'edit'>('closed')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const reload = async () => {
    router.refresh()
    const response = await fetch('/api/links')
    if (response.ok) setLinks(await response.json())
  }

  const closeForm = () => {
    setMode('closed')
    setEditingId(null)
    setForm(emptyForm())
    setError('')
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = links.findIndex((link: any) => link.id === active.id)
    const newIndex = links.findIndex((link: any) => link.id === over.id)
    const newLinks = arrayMove(links, oldIndex, newIndex)
    setLinks(newLinks)
    try {
      await Promise.all(newLinks.map((link: any, index: number) =>
        fetch(`/api/links/${link.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: index }) })
      ))
      router.refresh()
    } catch (err) {
      console.error('Sıralama güncellenirken hata:', err)
    }
  }

  const handleSave = async () => {
    setError('')
    if (!form.title.trim()) return setError('Başlık gerekli')
    setSaving(true)
    try {
      const response = await fetch(mode === 'edit' ? `/api/links/${editingId}` : '/api/links', {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadFromForm(form, mode === 'edit' ? 'edit' : 'add')),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Kaydedilemedi')
      closeForm()
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu bloğu silmek istediğinize emin misiniz?')) return
    const response = await fetch(`/api/links/${id}`, { method: 'DELETE' })
    if (response.ok) await reload()
    else alert('Silinirken hata oluştu')
  }

  const toggleEnabled = async (id: number, enabled: boolean) => {
    const response = await fetch(`/api/links/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !enabled }) })
    if (response.ok) await reload()
  }

  const handleEditClick = (link: any) => {
    setForm(formFromLink(link))
    setEditingId(link.id)
    setMode('edit')
    setError('')
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="bg-dark-card border border-gray-800 rounded-2xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Link ve Blok Yönetimi</h2>
        <button
          onClick={() => { setForm(emptyForm()); setEditingId(null); setMode('add'); setError('') }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all"
        >
          <FaPlus className="w-4 h-4" />
          <span>Yeni Ekle</span>
        </button>
      </div>

      {mode !== 'closed' && (
        <div className={`mb-6 p-6 bg-dark-bg rounded-xl border-2 ${mode === 'edit' ? 'border-blue-500/30' : 'border-purple-500/30'}`}>
          <h3 className="text-lg font-semibold text-white mb-4">{mode === 'edit' ? 'Düzenle' : 'Yeni Ekle'}</h3>
          <LinkFormFields form={form} setForm={setForm} mode={mode === 'edit' ? 'edit' : 'add'} />
          {error && <p className="mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 ${mode === 'edit' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg transition-colors disabled:opacity-60`}
            >
              <FaSave className="w-4 h-4" />
              <span>{saving ? 'Kaydediliyor...' : mode === 'edit' ? 'Güncelle' : 'Kaydet'}</span>
            </button>
            <button onClick={closeForm} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors" aria-label="Vazgeç">
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="space-y-3">
          {links.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Henüz bir şey eklenmemiş</p>
          ) : (
            <SortableContext items={links.map((link: any) => link.id)} strategy={verticalListSortingStrategy}>
              {links.map((link: any) => (
                <SortableLinkItem key={link.id} link={link} onToggle={toggleEnabled} onDelete={handleDelete} onEdit={handleEditClick} />
              ))}
            </SortableContext>
          )}
        </div>
      </DndContext>
    </div>
  )
}
