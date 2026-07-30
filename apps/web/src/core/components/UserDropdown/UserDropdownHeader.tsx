import { Pencil } from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import styles from './UserDropdown.module.css'

interface UserDropdownHeaderProps {
  accentColor: string
  displayName: string
  imageError: boolean
  imageUrl?: string | null
  initials: string
  isMounted: boolean
  onImageError: () => void
  primaryColor: string
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
  roleLabel,
  onProfileClick,
}: UserDropdownHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerRow}>
        <UserAvatar accentColor={accentColor} imageError={imageError} imageUrl={imageUrl} initials={initials} isMounted={isMounted} onImageError={onImageError} primaryColor={primaryColor} size="sm" />
        <div className={styles.headerCopy}>
          <h3 className={styles.headerName}>{displayName}</h3>
          <p className={styles.headerRole}>{roleLabel}</p>
        </div>
        {onProfileClick && (
          <button
            type="button"
            onClick={onProfileClick}
            className={styles.iconButton}
            title="Editar perfil"
            aria-label="Editar perfil"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </header>
  )
}
