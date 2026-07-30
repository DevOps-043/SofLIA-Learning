'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { UserAvatar } from './UserAvatar'
import { UserDropdownPortal } from './UserDropdownPortal'
import type { UserDropdownProps } from './types'
import { useUserDropdownLogic } from './useUserDropdownLogic'
import styles from './UserDropdown.module.css'

export const UserDropdown = React.memo(function UserDropdown({
  certificatesCount = 0,
  className = '',
  onAnalyticsClick,
  onCertificatesClick,
  onLogout,
  onProfileClick,
  user: userProp,
}: UserDropdownProps) {
  const logic = useUserDropdownLogic(userProp, {
    certificatesCount,
    onAnalyticsClick,
    onCertificatesClick,
    onLogout,
    onProfileClick,
  })

  return (
    <div className={`${styles.root} ${className}`} ref={logic.dropdownRef}>
      <motion.button
        type="button"
        onClick={() => { logic.setIsOpen(!logic.isOpen); logic.setActiveSubmenu(null) }}
        className={styles.trigger}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-expanded={logic.isOpen}
        aria-controls="global-user-dropdown-menu"
      >
        <div className={styles.triggerAvatar}>
          <UserAvatar
            accentColor={logic.accentColor}
            imageError={logic.imageError}
            imageUrl={logic.imageUrl}
            initials={logic.initials}
            isMounted={logic.isMounted}
            isOpen={logic.isOpen}
            onImageError={() => logic.setImageError(true)}
            primaryColor={logic.primaryColor}
          />
          <span className={styles.presence} aria-hidden="true" />
        </div>
      </motion.button>
      <UserDropdownPortal logic={logic} />
    </div>
  )
})
