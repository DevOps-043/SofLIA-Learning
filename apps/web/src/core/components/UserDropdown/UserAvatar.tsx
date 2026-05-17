interface UserAvatarProps {
  accentColor: string
  imageError: boolean
  imageUrl?: string | null
  initials: string
  isMounted: boolean
  isOpen?: boolean
  onImageError: () => void
  primaryColor: string
  size?: 'sm' | 'md'
}

export function UserAvatar({
  accentColor,
  imageError,
  imageUrl,
  initials,
  isMounted,
  isOpen = false,
  onImageError,
  primaryColor,
  size = 'md',
}: UserAvatarProps) {
  const sizeClass = size === 'sm' ? 'w-10 h-10' : 'h-10 w-10'
  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden ring-2 ring-white/80 dark:ring-white/80 flex items-center justify-center shadow-sm`}
      style={{
        background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
        boxShadow: isOpen ? `0 0 20px ${accentColor}40` : `0 4px 12px ${primaryColor}30`,
      }}
    >
      {!isMounted ? (
        <span className="text-white text-xs font-bold tracking-wider">U</span>
      ) : imageUrl && !imageError ? (
        <img src={imageUrl} alt="Avatar" className="w-full h-full object-cover" onError={onImageError} />
      ) : (
        <span className="text-white text-xs font-bold tracking-wider">{initials}</span>
      )}
    </div>
  )
}
