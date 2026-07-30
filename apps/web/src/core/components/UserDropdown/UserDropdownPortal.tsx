import { createPortal } from 'react-dom'
import type { CSSProperties } from 'react'
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
import styles from './UserDropdown.module.css'

type UserDropdownLogic = ReturnType<typeof useUserDropdownLogic>

export function UserDropdownPortal({ logic }: { logic: UserDropdownLogic }) {
  if (!logic.isMounted) return null

  const menuStyle = logic.isMobileViewport
    ? {
        zIndex: USER_DROPDOWN_MENU_Z_INDEX,
        top: logic.pos.top,
        right: 0,
        bottom: 0,
        left: 0,
        maxHeight: 'none',
        height: `calc(var(--soflia-viewport-height) - ${logic.pos.top}px)`,
        '--user-primary': logic.primaryColor,
        '--user-accent': logic.accentColor,
      }
    : {
        zIndex: USER_DROPDOWN_MENU_Z_INDEX,
        top: logic.pos.top,
        right: logic.pos.right,
        maxHeight: `calc(var(--soflia-viewport-height) - ${logic.pos.top}px - 16px)`,
        '--user-primary': logic.primaryColor,
        '--user-accent': logic.accentColor,
      }

  return createPortal(
    <AnimatePresence>
      {logic.isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.backdrop}
            style={{ zIndex: USER_DROPDOWN_BACKDROP_Z_INDEX }}
            onClick={() => { logic.setIsOpen(false); logic.setActiveSubmenu(null); logic.setIsOrgSwitcherOpen(false) }}
          />
          <motion.div
            id="global-user-dropdown-menu"
            initial={logic.isMobileViewport ? { opacity: 0, y: -12 } : { opacity: 0, y: -8, scale: 0.95 }}
            animate={logic.isMobileViewport ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={logic.isMobileViewport ? { opacity: 0, y: -12 } : { opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={styles.menu}
            style={menuStyle as CSSProperties}
            role="menu"
          >
            <div className={cn(logic.isMobileViewport && styles.mobileLayout)}>
              <div className={cn(logic.isMobileViewport && styles.mobileSection)}>
                <UserDropdownHeader
                  accentColor={logic.accentColor}
                  displayName={logic.displayName}
                  imageError={logic.imageError}
                  imageUrl={logic.imageUrl}
                  initials={logic.initials}
                  isMounted={logic.isMounted}
                  onImageError={() => logic.setImageError(true)}
                  primaryColor={logic.primaryColor}
                  roleLabel={logic.roleLabel}
                  onProfileClick={logic.handleProfileClick}
                />
              </div>
              <div className={cn(logic.isMobileViewport && styles.mobileSection)}>
                <UserDropdownOrgSection logic={logic} />
              </div>
              <div className={cn(logic.isMobileViewport && styles.mobileSection)}>
                <UserDropdownPanelSwitcher logic={logic} />
              </div>
              <div className={cn(logic.isMobileViewport && styles.mobileSection)}>
                <UserDropdownMenuItems logic={logic} />
              </div>
              <div className={cn(
                styles.logoutWrap,
                logic.isMobileViewport && styles.logoutWrapMobile,
              )}>
                <motion.button
                  type="button"
                  onClick={logic.handleLogout}
                  className={styles.logoutButton}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut className={styles.menuItemIcon} />
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
