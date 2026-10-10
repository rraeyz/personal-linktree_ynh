'use client'

// Profil fotoğrafı; yüklenemezse bir kez varsayılan avatara döner (döngüye girmez)
export default function ProfileAvatar({ src, name }: { src: string; name: string }) {
  return (
    <div className="profile-avatar shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || '/default-avatar.jpg'}
        alt={name}
        width={128}
        height={128}
        className="w-full h-full rounded-full object-cover"
        onError={(e) => {
          const target = e.currentTarget
          if (!target.src.endsWith('/default-avatar.jpg')) target.src = '/default-avatar.jpg'
        }}
      />
    </div>
  )
}
