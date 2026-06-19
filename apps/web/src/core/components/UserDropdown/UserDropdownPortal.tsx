import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { UserDropdownPanelSwitcher } from './PanelSwitcher'
import { UserDropdownHeader } from './UserDropdownHeader'
import { UserDropdownMenuItems } from './UserDropdownMenuItems'
import { UserDropdownOrgSection } from './UserDropdownOrgSection'
import {
  USER_DROPDOWN_BACKDROP_Z_INDEX,
  USER_DROPDOWN_MENU_Z_INDEX,
} from './types'
import type { useUserDropdownLogic } from './useUserDropdownLogic'

type UserDropdownLogic = ReturnType<typeof useUserDropdownLogic>

export function UserDropdownPortal({ logic }: { logic: UserDropdownLogic }) {
  if (!logic.isMounted) return null

  const isOrgBranded = Boolean(logic.primaryColor && logic.primaryColor !== 'var(--color-primary)')
  const isDark = logic.resolvedTheme === 'dark'

  const orgBrandStyles = isOrgBranded
    ? {
        backgroundColor: isDark
          ? `color-mix(in srgb, ${logic.primaryColor} 12%, #111822)`
          : 'rgba(255, 255, 255, 0.97)',
        borderColor: isDark
          ? `color-mix(in srgb, ${logic.primaryColor} 28%, transparent)`
          : `color-mix(in srgb, ${logic.primaryColor} 18%, var(--color-gray-200))`,
      }
    : {}

  const menuStyle = logic.isMobileViewport
    ? {
        zIndex: USER_DROPDOWN_MENU_Z_INDEX,
        top: logic.pos.top,
        right: 0,
        bottom: 0,
        left: 0,
        maxHeight: 'none',
        height: `calc(var(--soflia-viewport-height) - ${logic.pos.top}px)`,
        ...orgBrandStyles,
      }
    : {
        zIndex: USER_DROPDOWN_MENU_Z_INDEX,
        top: logic.pos.top,
        right: logic.pos.right,
        maxHeight: `calc(var(--soflia-viewport-height) - ${logic.pos.top}px - 16px)`,
        ...orgBrandStyles,
      }
  const mobileSectionClassName = logic.isMobileViewport
    ? 'overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-carbon-800'
    : ''

  return createPortal(
    <AnimatePresence>
      {logic.isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10"
            style={{ zIndex: USER_DROPDOWN_BACKDROP_Z_INDEX }}
            onClick={() => { logic.setIsOpen(false); logic.setActiveSubmenu(null); logic.setIsOrgSwitcherOpen(false) }}
          />
          <motion.div
            id="global-user-dropdown-menu"
            initial={logic.isMobileViewport ? { opacity: 0, y: -12 } : { opacity: 0, y: -8, scale: 0.95 }}
            animate={logic.isMobileViewport ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={logic.isMobileViewport ? { opacity: 0, y: -12 } : { opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              'fixed overflow-y-auto border shadow-2xl border-gray-200 dark:border-white/10',
              logic.isMobileViewport
                ? 'w-screen max-w-none rounded-none border-x-0 border-b-0 bg-gray-50 dark:bg-carbon-900'
                : 'w-[308px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white/95 backdrop-blur-xl dark:bg-carbon-800/95',
            )}
            style={menuStyle}
          >
            <div className={cn(logic.isMobileViewport && 'flex min-h-full flex-col gap-2 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]')}>
              <div className={cn(logic.isMobileViewport && 'basis-[12%] min-h-[72px]', mobileSectionClassName)}>
                <UserDropdownHeader
                  accentColor={logic.accentColor}
                  displayName={logic.displayName}
                  imageError={logic.imageError}
                  imageUrl={logic.imageUrl}
                  initials={logic.initials}
                  isMounted={logic.isMounted}
                  onImageError={() => logic.setImageError(true)}
                  primaryColor={logic.primaryColor}
                  resolvedTheme={logic.resolvedTheme}
                  roleLabel={logic.roleLabel}
                  onProfileClick={logic.handleProfileClick}
                />
              </div>
              <div className={cn(logic.isMobileViewport && 'basis-[24%] min-h-[132px]', mobileSectionClassName)}>
                <UserDropdownOrgSection logic={logic} />
              </div>
              <div className={cn(logic.isMobileViewport && 'basis-[11%] min-h-[62px]', mobileSectionClassName)}>
                <UserDropdownPanelSwitcher logic={logic} />
              </div>
              <div className={cn(logic.isMobileViewport && 'min-h-[188px] flex-1', mobileSectionClassName)}>
                <UserDropdownMenuItems logic={logic} />
              </div>
              <div className={cn(
                'px-2 py-1.5 border-t border-gray-200 dark:border-white/5',
                logic.isMobileViewport && 'basis-[9%] min-h-[58px] rounded-2xl border border-red-500/20 bg-red-500/5 dark:border-red-400/20 dark:bg-red-500/10',
              )}>
                <motion.button
                  onClick={logic.handleLogout}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-all',
                    logic.isMobileViewport && 'h-full min-h-11',
                  )}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut className="w-[18px] h-[18px]" />
                  <span>{logic.t('menu.logout')}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
