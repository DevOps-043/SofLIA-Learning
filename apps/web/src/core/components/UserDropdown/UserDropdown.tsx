'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { UserAvatar } from './UserAvatar'
import { UserDropdownPortal } from './UserDropdownPortal'
import type { UserDropdownProps } from './types'
import { useUserDropdownLogic } from './useUserDropdownLogic'

export const UserDropdown = React.memo(function UserDropdown({
  className = '',
  user: userProp,
}: UserDropdownProps) {
  const logic = useUserDropdownLogic(userProp)

  return (
    <div className={`relative ${className}`} ref={logic.dropdownRef}>
      <motion.button
        onClick={() => { logic.setIsOpen(!logic.isOpen); logic.setActiveSubmenu(null) }}
        className="flex items-center justify-center p-1 rounded-full transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
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
          <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-[#10B981] rounded-full border-2 border-white dark:border-[#0F1419] shadow-sm" />
        </div>
      </motion.button>
      <UserDropdownPortal logic={logic} />
    </div>
  )
})
