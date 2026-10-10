import { FaCheckCircle, FaCrown, FaStar, FaHeart } from 'react-icons/fa'
import type { IconType } from 'react-icons'
import SocialIcons from '../SocialIcons'
import ProfileAvatar from './ProfileAvatar'
import LocalTime from './LocalTime'
import ProfileActions from './ProfileActions'

// Rozetler (admin: Profil → Rozetler & Doğrulama)
const BADGES: Record<string, { Icon: IconType; color: string; label: string }> = {
  verified: { Icon: FaCheckCircle, color: 'text-blue-400', label: 'Doğrulanmış' },
  premium: { Icon: FaCrown, color: 'text-yellow-400', label: 'Premium' },
  star: { Icon: FaStar, color: 'text-purple-400', label: 'Yıldız' },
  supporter: { Icon: FaHeart, color: 'text-pink-400', label: 'Destekçi' },
}

function parseBadges(value: string): string[] {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed.filter((badge) => typeof badge === 'string' && BADGES[badge]) : []
  } catch {
    return []
  }
}

interface ProfileCardProps {
  profile: {
    name: string
    bio: string
    imageUrl: string
    verified: boolean
    badges: string
    statusText: string
    location: string
    timezone: string
    showSocialIcons: boolean
    showShareButton: boolean
    showVCard: boolean
    linkedinUrl: string
    twitterUrl: string
    discordUrl: string
    youtubeUrl: string
    instagramUrl: string
    githubUrl: string
  }
  // "Bana yaz": admin açtıysa VE iletişim e-postası + SMTP ayarlıysa
  showContact: boolean
}

// Profil kartı: geniş ekranda sol sütun, telefonda sayfanın başı. Boş alanlar hiç çizilmez.
export default function ProfileCard({ profile, showContact }: ProfileCardProps) {
  const badges = parseBadges(profile.badges)
  const hasChips = !!(profile.statusText || profile.location || profile.timezone)

  return (
    <div className="flex flex-col items-center text-center lg:items-start lg:text-left gap-5 text-dynamic-text">
      <ProfileAvatar src={profile.imageUrl} name={profile.name} />

      <div className="w-full">
        <h1 className="max-w-full text-3xl sm:text-4xl lg:text-[2.6rem] font-bold leading-tight tracking-tight inline-flex flex-wrap items-center justify-center lg:justify-start gap-x-2.5 gap-y-1 [overflow-wrap:anywhere]">
          {profile.name}
          {profile.verified && <FaCheckCircle className="w-6 h-6 text-blue-400 shrink-0" title="Doğrulanmış profil" aria-label="Doğrulanmış profil" />}
        </h1>
        {badges.length > 0 && (
          <div className="flex gap-2 mt-2 justify-center lg:justify-start">
            {badges.map((badge) => {
              const { Icon, color, label } = BADGES[badge]
              return <Icon key={badge} className={`w-5 h-5 ${color}`} title={label} aria-label={label} />
            })}
          </div>
        )}
        {profile.bio && <p className="mt-3 text-base lg:text-[1.05rem] leading-relaxed opacity-80 whitespace-pre-line break-words">{profile.bio}</p>}
      </div>

      {hasChips && (
        <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
          {profile.statusText && (
            <span className="profile-chip max-w-full">
              <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" aria-hidden="true" />
              {profile.statusText}
            </span>
          )}
          <LocalTime location={profile.location} timezone={profile.timezone} />
        </div>
      )}

      {profile.showSocialIcons && (
        <SocialIcons
          className="justify-center lg:justify-start"
          linkedinUrl={profile.linkedinUrl}
          twitterUrl={profile.twitterUrl}
          discordUrl={profile.discordUrl}
          youtubeUrl={profile.youtubeUrl}
          instagramUrl={profile.instagramUrl}
          githubUrl={profile.githubUrl}
        />
      )}

      <ProfileActions
        shareTitle={profile.name}
        showContact={showContact}
        showShare={profile.showShareButton}
        showVCard={profile.showVCard}
      />
    </div>
  )
}
