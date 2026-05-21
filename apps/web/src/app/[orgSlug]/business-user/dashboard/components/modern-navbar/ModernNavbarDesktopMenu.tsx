'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Building2,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronRight,
  Globe,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  User,
} from 'lucide-react'
import { BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS } from '../../../../../../core/constants/tourTargets'
import type { Theme } from '../../../../../../core/stores/themeStore'
import { LANGUAGE_OPTIONS, THEME_OPTIONS } from './constants'
import { ModernNavbarAvatar } from './ModernNavbarAvatar'
import { buildStudyPlannerEntryPath } from './service'
import type { ModernNavbarColors, ModernNavbarOrganization, ModernNavbarUser } from './types'

interface ModernNavbarDesktopMenuProps {
  activeSubmenu: string | null;
  canAccessAdminPanel: boolean;
  colors: ModernNavbarColors;
  getDisplayName: () => string;
  getInitials: () => string;
  hasStudyPlan: boolean | null;
  language: string;
  onClose: () => void;
  onLogout: () => void;
  onProfileClick: () => void;
  onRestartTour?: () => void;
  organization: ModernNavbarOrganization | null;
  resolvedTheme: string | null | undefined;
  router: { push: (href: string) => void };
  setActiveSubmenu: (value: string | null) => void;
  setLanguage: (value: 'es' | 'en' | 'pt') => void;
  setTheme: (value: Theme) => void;
  setUserDropdownOpen: (value: boolean) => void;
  t: (key: string) => string;
  theme: Theme;
  user: ModernNavbarUser | null;
  userDropdownOpen: boolean;
  showOrganizations: boolean;
}

export function ModernNavbarDesktopMenu({
  activeSubmenu,
  canAccessAdminPanel,
  colors,
  getDisplayName,
  getInitials,
  hasStudyPlan,
  language,
  onClose,
  onLogout,
  onProfileClick,
  organization,
  resolvedTheme,
  router,
  setActiveSubmenu,
  setLanguage,
  setTheme,
  setUserDropdownOpen,
  t,
  theme,
  user,
  userDropdownOpen,
  showOrganizations,
}: ModernNavbarDesktopMenuProps) {
  const hoverBackground = colors.isLightMode ? 'rgba(10,37,64,0.05)' : 'rgba(0,212,179,0.08)'
  const menuItemClass = 'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors'
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ top: number; right: number }>({ top: 72, right: 16 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!userDropdownOpen || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
  }, [userDropdownOpen])

  const panel = (
    <AnimatePresence>
      {userDropdownOpen && (
        <>
          {/* Backdrop — fixed, por encima de TODOS los elementos flotantes */}
          <motion.div
            id="tour-user-dropdown-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10"
            style={{ zIndex: 99998 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            data-modern-navbar-dropdown="true"
            id={BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.userDropdownMenu}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed w-[260px] rounded-2xl border backdrop-blur-xl shadow-xl overflow-hidden"
            style={{
              zIndex: 99999,
              top: pos.top,
              right: pos.right,
              backgroundColor: colors.navBg,
              borderColor: colors.border,
            }}
          >
            {/* User header */}
            <div
              className="border-b p-4"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.isLightMode ? 'rgba(248,250,252,0.7)' : 'rgba(10,13,18,0.3)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-white/70 dark:ring-white/80"
                  style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}
                >
                  <ModernNavbarAvatar
                    alt={getDisplayName()}
                    className="h-full w-full rounded-full object-cover"
                    initials={getInitials()}
                    profilePictureUrl={user?.profile_picture_url}
                    size={40}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: colors.text }}>
                    {getDisplayName()}
                  </p>
                  <p className="text-xs truncate" style={{ color: colors.isLightMode ? '#64748B' : 'rgba(255,255,255,0.7)' }}>
                    {user?.email || ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1 p-2">
              {/* Panel Administración */}
              {canAccessAdminPanel && (
                <motion.button
                  onClick={() => { router.push(`/${organization?.slug || ''}/business-panel/dashboard`); onClose() }}
                  className={menuItemClass}
                  style={{ color: colors.text }}
                  whileHover={{ x: 2, backgroundColor: hoverBackground }}
                >
                  <LayoutDashboard className="h-5 w-5 opacity-70" />
                  <span>{t('header.adminPanel')}</span>
                </motion.button>
              )}

              {/* Planificador */}
              {hasStudyPlan !== null && (
                <motion.button
                  onClick={() => {
                    router.push(buildStudyPlannerEntryPath({ hasStudyPlan, organizationSlug: organization?.slug }))
                    onClose()
                  }}
                  className={menuItemClass}
                  style={{ color: colors.text }}
                  whileHover={{ x: 2, backgroundColor: hoverBackground }}
                >
                  {hasStudyPlan ? <CalendarDays className="h-5 w-5 opacity-70" /> : <CalendarPlus className="h-5 w-5 opacity-70" />}
                  <span>{hasStudyPlan ? t('header.myPlanner') : t('header.createStudyPlan')}</span>
                </motion.button>
              )}

              {/* Mis organizaciones */}
              {showOrganizations && (
                <motion.button
                  onClick={() => { router.push('/auth/select-organization'); onClose() }}
                  className={menuItemClass}
                  style={{ color: colors.text }}
                  whileHover={{ x: 2, backgroundColor: hoverBackground }}
                >
                  <Building2 className="h-5 w-5 opacity-70" />
                  <span>{t('common:profileDropdown.organizations')}</span>
                </motion.button>
              )}

              {/* Editar perfil */}
              <motion.button
                onClick={() => { onProfileClick(); onClose() }}
                className={menuItemClass}
                style={{ color: colors.text }}
                whileHover={{ x: 2, backgroundColor: hoverBackground }}
              >
                <User className="h-5 w-5 opacity-70" />
                <span>{t('header.editProfile')}</span>
              </motion.button>

              {/* Idioma */}
              <div className="relative">
                <motion.button
                  onClick={(e) => { e.stopPropagation(); setActiveSubmenu(activeSubmenu === 'language' ? null : 'language') }}
                  className={menuItemClass}
                  style={{ color: colors.text }}
                  whileHover={{ x: 2, backgroundColor: hoverBackground }}
                >
                  <Globe className="h-5 w-5 opacity-70" />
                  <span className="flex-1 text-left">{t('header.language')}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs opacity-70">{language.toUpperCase()}</span>
                    <ChevronRight className={`h-3.5 w-3.5 opacity-70 transition-transform ${activeSubmenu === 'language' ? 'rotate-90' : ''}`} />
                  </div>
                </motion.button>
                <AnimatePresence>
                  {activeSubmenu === 'language' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden" style={{ backgroundColor: colors.isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.2)' }}>
                      {LANGUAGE_OPTIONS.map((option) => (
                        <button key={option.value} onClick={() => { setLanguage(option.value) }}
                          className="w-full flex items-center gap-3 px-10 py-2 text-xs transition-colors"
                          style={{ color: language === option.value ? colors.accent : colors.text }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hoverBackground }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                          <span>{option.label}</span>
                          {language === option.value && <Check className="h-3 w-3 ml-auto" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tema */}
              <div className="relative">
                <motion.button
                  onClick={(e) => { e.stopPropagation(); setActiveSubmenu(activeSubmenu === 'theme' ? null : 'theme') }}
                  className={menuItemClass}
                  style={{ color: colors.text }}
                  whileHover={{ x: 2, backgroundColor: hoverBackground }}
                >
                  {resolvedTheme === 'dark' ? <Moon className="h-5 w-5 opacity-70" /> : <Sun className="h-5 w-5 opacity-70" />}
                  <span className="flex-1 text-left">{t('common:profileDropdown.theme')}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs opacity-70">{t(`common:menu.theme.${theme}`)}</span>
                    <ChevronRight className={`h-3.5 w-3.5 opacity-70 transition-transform ${activeSubmenu === 'theme' ? 'rotate-90' : ''}`} />
                  </div>
                </motion.button>
                <AnimatePresence>
                  {activeSubmenu === 'theme' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden" style={{ backgroundColor: colors.isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.2)' }}>
                      {THEME_OPTIONS.map((option) => {
                        const ThemeIcon = option.icon
                        return (
                          <button key={option.value} onClick={() => { setTheme(option.value) }}
                            className="w-full flex items-center gap-3 px-10 py-2 text-xs transition-colors"
                            style={{ color: theme === option.value ? colors.accent : colors.text }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hoverBackground }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                            <ThemeIcon className="h-3.5 w-3.5" />
                            <span>{t(`common:menu.theme.${option.value}`)}</span>
                            {theme === option.value && <Check className="h-3 w-3 ml-auto" />}
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="-mx-2 my-1 border-t" style={{ borderColor: colors.border }} />

              {/* Cerrar sesión */}
              <motion.button
                onClick={() => { onLogout(); onClose() }}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10"
                whileHover={{ x: 2 }}
              >
                <LogOut className="h-5 w-5" />
                <span>{t('header.logout')}</span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {/* Trigger button */}
      <motion.button
        ref={triggerRef}
        id={BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.userDropdownTrigger}
        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
        className="flex items-center justify-center rounded-full p-1 transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div
          className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-2 ring-white/80 dark:ring-white/80"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
            boxShadow: `0 4px 15px ${colors.primary}40`,
          }}
        >
          <ModernNavbarAvatar
            alt={getDisplayName()}
            className="h-full w-full rounded-full object-cover"
            initials={getInitials()}
            profilePictureUrl={user?.profile_picture_url}
            size={40}
          />
        </div>
      </motion.button>

      {/* Dropdown renderizado via portal — escapa el stacking context del nav */}
      {mounted && createPortal(panel, document.body)}
    </>
  )
}
