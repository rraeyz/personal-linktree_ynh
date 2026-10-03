import { FaDiscord, FaGithub, FaInstagram, FaLinkedin, FaXTwitter, FaYoutube } from 'react-icons/fa6'
import type { IconType } from 'react-icons'
import { isSafeUrl } from '@/lib/security'

interface SocialIconsProps {
  linkedinUrl: string
  twitterUrl: string
  discordUrl: string
  youtubeUrl: string
  instagramUrl: string
  githubUrl: string
}

// Profildeki sosyal medya hesapları; sunucuda çizilir (sayfaya ek JavaScript eklemez)
export default function SocialIcons(props: SocialIconsProps) {
  const items: { url: string; label: string; Icon: IconType }[] = [
    { url: props.instagramUrl, label: 'Instagram', Icon: FaInstagram },
    { url: props.twitterUrl, label: 'X (Twitter)', Icon: FaXTwitter },
    { url: props.linkedinUrl, label: 'LinkedIn', Icon: FaLinkedin },
    { url: props.youtubeUrl, label: 'YouTube', Icon: FaYoutube },
    { url: props.githubUrl, label: 'GitHub', Icon: FaGithub },
    { url: props.discordUrl, label: 'Discord', Icon: FaDiscord },
  ].filter((item) => isSafeUrl(item.url))

  if (items.length === 0) return null

  return (
    <nav aria-label="Sosyal medya hesapları" className="flex flex-wrap justify-center gap-3 mt-6">
      {items.map(({ url, label, Icon }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer me"
          aria-label={label}
          title={label}
          className="p-3 rounded-full bg-dynamic-card border border-dynamic text-dynamic-text hover:text-[color:var(--color-primary)] hover:border-dynamic-primary hover:-translate-y-0.5 transition-all"
        >
          <Icon className="w-5 h-5" />
        </a>
      ))}
    </nav>
  )
}
