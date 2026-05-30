import { Pencil } from 'lucide-react'
import { UserAvatar } from './UserAvatar'

interface UserDropdownHeaderProps {
  accentColor: string
  displayName: string
  imageError: boolean
  imageUrl?: string | null
  initials: string
  isMounted: boolean
  onImageError: () => void
  primaryColor: string
  resolvedTheme: string
  roleLabel: string
  onProfileClick?: () => void
}

export function UserDropdownHeader({
  accentColor,
  displayName,
  imageError,
  imageUrl,
  initials,
  isMounted,
  onImageError,
  primaryColor,
  resolvedTheme,
  roleLabel,
  onProfileClick,
}: UserDropdownHeaderProps) {
  return (
    <div className="px-3.5 py-3 border-b border-gray-200 dark:border-white/5" style={{ backgroundColor: resolvedTheme === 'dark' ? 'rgba(10, 13, 18, 0.4)' : 'rgba(248, 250, 252, 0.7)' }}>
      <div className="flex items-center gap-2.5">
        <UserAvatar accentColor={accentColor} imageError={imageError} imageUrl={imageUrl} initials={initials} isMounted={isMounted} onImageError={onImageError} primaryColor={primaryColor} size="sm" />
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-900 dark:text-white font-semibold text-sm truncate">{displayName}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{roleLabel}</p>
        </div>
        {onProfileClick && (
          <button
            onClick={onProfileClick}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
            title="Editar perfil"
            aria-label="Editar perfil"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
