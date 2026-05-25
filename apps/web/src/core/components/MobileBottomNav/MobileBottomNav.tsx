'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { usePrefetchOnHover } from '../../hooks/usePrefetch'
import { DirectoryDropdown } from './DirectoryDropdown'
import { MobileNavItemButton } from './MobileNavItemButton'
import { directoryOptions, navigationItems } from './mobile-bottom-nav.config'
import { getActiveMobileNavItem } from './mobile-bottom-nav.routes'

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isDirectoryDropdownOpen, setIsDirectoryDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const prefetchOnHover = usePrefetchOnHover()
  const activeItem = getActiveMobileNavItem(pathname)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isDirectoryDropdownOpen
        && dropdownRef.current
        && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDirectoryDropdownOpen(false)
      }
    }

    if (isDirectoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = ''
    }
  }, [isDirectoryDropdownOpen])

  const handleNavigation = (itemId: string, route: string | null) => {
    if (itemId === 'directory') {
      setIsDirectoryDropdownOpen((isOpen) => !isOpen)
    } else if (route) {
      router.push(route)
    }
  }

  const handleDirectoryOptionClick = (route: string) => {
    router.push(route)
    setIsDirectoryDropdownOpen(false)
  }

  return (
    <>
      <AnimatePresence>
        {isDirectoryDropdownOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[49] lg:hidden"
            onClick={() => setIsDirectoryDropdownOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 lg:hidden"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
          height: 'calc(70px + max(env(safe-area-inset-bottom), 8px))',
        }}
      >
        <div className="grid grid-cols-4 h-[70px]">
          {navigationItems.map((item) => (
            <div key={item.id} className="relative flex items-center justify-center">
              <MobileNavItemButton
                item={item}
                isActive={activeItem === item.id}
                isDropdownOpen={isDirectoryDropdownOpen}
                onNavigate={handleNavigation}
              />
              {item.id === 'directory' && (
                <DirectoryDropdown
                  dropdownRef={dropdownRef}
                  isOpen={isDirectoryDropdownOpen}
                  options={directoryOptions}
                  prefetchOnHover={prefetchOnHover}
                  onOptionClick={handleDirectoryOptionClick}
                />
              )}
            </div>
          ))}
        </div>
      </motion.nav>
    </>
  )
}
