'use client'

import Image from 'next/image'

interface AdminUserAvatarProps {
  displayName: string
  imageUrl: string | null
  size?: 'sm' | 'md' | 'lg'
  accentColor: string
  borderColor: string
}

const sizeClasses = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-14 w-14 text-lg',
  lg: 'h-16 w-16 text-xl',
}

export function AdminUserAvatar({
  displayName,
  imageUrl,
  size = 'md',
  accentColor,
  borderColor,
}: AdminUserAvatarProps) {
  const initial = (displayName.trim().charAt(0) || 'U').toUpperCase()

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 font-extrabold shadow-sm ${sizeClasses[size]}`}
      style={{
        borderColor,
        background: imageUrl
          ? undefined
          : `linear-gradient(135deg, ${accentColor}, color-mix(in srgb, ${accentColor} 82%, var(--color-bg-light)))`,
        color: 'var(--color-bg-light)',
      }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={displayName}
          fill
          sizes={size === 'lg' ? '64px' : size === 'md' ? '56px' : '40px'}
          className="object-cover"
          unoptimized
        />
      ) : (
        initial
      )}
    </div>
  )
}
