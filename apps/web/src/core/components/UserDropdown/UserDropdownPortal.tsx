import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { UserDropdownHeader } from './UserDropdownHeader'
import { UserDropdownMenuItems } from './UserDropdownMenuItems'
import {
  USER_DROPDOWN_BACKDROP_Z_INDEX,
  USER_DROPDOWN_MENU_Z_INDEX,
} from './types'
import type { useUserDropdownLogic } from './useUserDropdownLogic'

type UserDropdownLogic = ReturnType<typeof useUserDropdownLogic>

export function UserDropdownPortal({ logic }: { logic: UserDropdownLogic }) {
  if (!logic.isMounted) return null
  return createPortal(
    <AnimatePresence>
      {logic.isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/10" style={{ zIndex: USER_DROPDOWN_BACKDROP_Z_INDEX }} onClick={() => { logic.setIsOpen(false); logic.setActiveSubmenu(null) }} />
          <motion.div
            id="global-user-dropdown-menu"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed w-[240px] rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden bg-white/95 dark:bg-[#1A1F25]/95 border-gray-200 dark:border-white/10"
            style={{ zIndex: USER_DROPDOWN_MENU_Z_INDEX, top: logic.pos.top, right: logic.pos.right }}
          >
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
            />
            <UserDropdownMenuItems logic={logic} />
            <div className="px-2 py-2 border-t border-gray-200 dark:border-white/5">
              <motion.button onClick={logic.handleLogout} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-all" whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
                <LogOut className="w-[18px] h-[18px]" />
                <span>{logic.t('menu.logout')}</span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
