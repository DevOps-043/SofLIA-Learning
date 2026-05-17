'use client'

import { motion } from 'framer-motion'
import type { MobileNavItem } from './mobile-bottom-nav.types'

interface MobileNavItemButtonProps {
  item: MobileNavItem
  isActive: boolean
  isDropdownOpen: boolean
  onNavigate: (itemId: string, route: string | null) => void
}

export function MobileNavItemButton({
  item,
  isActive,
  isDropdownOpen,
  onNavigate,
}: MobileNavItemButtonProps) {
  const Icon = item.icon
  const isDirectory = item.id === 'directory'
  const activeClass = isActive && !isDirectory
    ? 'text-blue-600 dark:text-blue-400'
    : 'text-gray-600 dark:text-gray-400'
  const directoryOpenClass = isDirectory && isDropdownOpen ? 'text-blue-600 dark:text-blue-400' : ''

  return (
    <motion.button
      onClick={() => onNavigate(item.id, item.route)}
      className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors duration-200 ${activeClass} ${directoryOpenClass}`}
      whileTap={{ scale: 0.95 }}
    >
      {isActive && !isDirectory && (
        <motion.div
          layoutId="mobileBottomNavActive"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 dark:bg-blue-400 rounded-b-full"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}

      <div className="relative">
        <Icon className="w-5 h-5" />
      </div>

      <span className="text-[10px] font-medium leading-tight text-center px-1">
        {item.name}
      </span>
    </motion.button>
  )
}
