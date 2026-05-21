'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../features/auth/hooks/useAuth'
import { useUserProfile } from '../../../features/auth/hooks/useUserProfile'
import { useThemeStore } from '../../stores/themeStore'
import { useLanguage } from '../../providers/I18nProvider'
import { getOrganizationUserDashboardPath } from '../../utils/organizationNavigation'

// Lucide Icons
import {
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  BriefcaseBusiness,
  GraduationCap,
  Globe,
  LayoutDashboard,
  ShieldCheck,
  Check,
  Pencil,
  LucideIcon
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useOrganization, type Organization } from '../../hooks/useOrganization'

interface UserDropdownProps {
  className?: string
  user?: any // Optional user prop to override useAuth
  onRestartTour?: () => void
  onCertificatesClick?: () => void
  onAnalyticsClick?: () => void
  certificatesCount?: number
}

const USER_DROPDOWN_BACKDROP_Z_INDEX = 1000002
const USER_DROPDOWN_MENU_Z_INDEX = 1000003

export const UserDropdown = React.memo(function UserDropdown({
  className = '',
  user: userProp,
}: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 })
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const [isOrgSwitcherOpen, setIsOrgSwitcherOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user: authUser, logout } = useAuth()
  const user = userProp || authUser
  const { userProfile } = useUserProfile()
  const { theme, setTheme, resolvedTheme, initializeTheme } = useThemeStore()
  const { language, setLanguage } = useLanguage()
  const {
    currentOrganization,
    organizations,
    canSwitch,
    isB2B,
    isOrgAdmin,
    switchOrganization,
  } = useOrganization()
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation('common')
  const [isMounted, setIsMounted] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    initializeTheme()
  }, [initializeTheme])

  useEffect(() => {
    setImageError(false)
  }, [userProfile?.profile_picture_url, user?.profile_picture_url])

  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return
    const rect = dropdownRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const dropdownMenu = document.getElementById('global-user-dropdown-menu')
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        dropdownMenu && !dropdownMenu.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setActiveSubmenu(null)
        setIsOrgSwitcherOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isAdmin = useMemo(() => user?.cargo_rol?.toLowerCase() === 'administrador', [user?.cargo_rol])
  const isInstructor = useMemo(() => user?.cargo_rol?.toLowerCase() === 'instructor', [user?.cargo_rol])
  const fallbackOrganization = useMemo<Organization | null>(() => {
    if (currentOrganization || !user?.organization?.slug) return null

    return {
      id: user.organization.id || user.organization.slug,
      name: user.organization.name,
      slug: user.organization.slug,
      logoUrl: user.organization.logo_url,
      brandLogoUrl: user.organization.brand_logo_url,
      brandColorPrimary: user.organization.brand_color_primary,
      role: isAdmin ? 'admin' : 'member',
    }
  }, [currentOrganization, isAdmin, user?.organization])
  const activeOrganization = currentOrganization || fallbackOrganization

  const handleLogout = useCallback(async () => {
    await logout()
    setIsOpen(false)
    setIsOrgSwitcherOpen(false)
  }, [logout])

  const handleNavigation = useCallback((path: string) => {
    router.push(path)
    setIsOpen(false)
    setActiveSubmenu(null)
    setIsOrgSwitcherOpen(false)
  }, [router])

  const handleOrganizationSwitch = useCallback((organization: Organization) => {
    if (organization.id !== activeOrganization?.id) {
      switchOrganization(organization.slug)
    }
    setIsOpen(false)
    setActiveSubmenu(null)
    setIsOrgSwitcherOpen(false)
  }, [activeOrganization?.id, switchOrganization])

  const handleUserDashboardNavigation = useCallback(() => {
    handleNavigation(
      currentOrganization?.slug
        ? getOrganizationUserDashboardPath(currentOrganization.slug)
        : '/dashboard'
    )
  }, [currentOrganization?.slug, handleNavigation])

  const profilePath = useMemo(
    () => currentOrganization?.slug ? `/${currentOrganization.slug}/profile` : '/profile',
    [currentOrganization?.slug],
  )

  const handleThemeToggle = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  const getDisplayName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`
    }
    return userProfile?.display_name || user?.display_name || userProfile?.first_name || t('profileDropdown.userFallback')
  }

  const getRoleLabel = () => {
    if (isAdmin) return 'Superadmin'
    if (isInstructor) return 'Instructor'
    if (isOrgAdmin) return t('profileDropdown.orgRoles.admin')
    return user?.cargo_rol || ''
  }

  const getOrganizationRoleLabel = (role?: Organization['role']) => {
    if (!role) return t('profileDropdown.orgRoles.member')
    return t(`profileDropdown.orgRoles.${role}`)
  }

  const getOrganizationDisplayName = (organization?: Organization | null) => {
    return (
      organization?.name?.trim() ||
      organization?.slug?.trim() ||
      organization?.id?.trim() ||
      t('profileDropdown.organizations')
    )
  }

  const getInitials = () => {
    const name: string = getDisplayName()
    const parts = name.split(' ').filter((segment): segment is string => Boolean(segment))
    if (parts.length === 0) return 'U'
    return parts
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const languageOptions = [
    { value: 'es' as const, label: t('menu.languages.es'), flag: '🇲🇽' },
    { value: 'en' as const, label: t('menu.languages.en'), flag: '🇺🇸' },
    { value: 'pt' as const, label: t('menu.languages.pt'), flag: '🇧🇷' },
  ]

  const primaryColor = activeOrganization?.brandColorPrimary || 'var(--color-primary)'
  const accentColor = 'var(--color-accent)'
  const availablePanelLinks = useMemo<PanelSwitcherItem[]>(() => {
    const links: PanelSwitcherItem[] = []

    if (isAdmin) {
      links.push({
        id: 'admin',
        icon: ShieldCheck,
        label: t('profileDropdown.panels.admin'),
        isActive: pathname?.startsWith('/admin') ?? false,
        onClick: () => handleNavigation('/admin/dashboard'),
      })
    }

    if (isInstructor) {
      links.push({
        id: 'instructor',
        icon: GraduationCap,
        label: t('profileDropdown.panels.instructor'),
        isActive: pathname?.startsWith('/instructor') ?? false,
        onClick: () => handleNavigation('/instructor/dashboard'),
      })
    }

    if (isOrgAdmin && currentOrganization) {
      links.push({
        id: 'business',
        icon: BriefcaseBusiness,
        label: t('profileDropdown.panels.business'),
        isActive: pathname?.startsWith(`/${currentOrganization.slug}/business-panel`) ?? false,
        onClick: () => handleNavigation(`/${currentOrganization.slug}/business-panel`),
      })
    }

    links.push({
      id: 'user',
      icon: LayoutDashboard,
      label: t('profileDropdown.panels.user'),
      isActive: currentOrganization?.slug
        ? pathname?.startsWith(`/${currentOrganization.slug}/business-user`) ?? false
        : pathname === '/dashboard',
      onClick: handleUserDashboardNavigation,
    })

    return links
  }, [
    currentOrganization,
    handleNavigation,
    handleUserDashboardNavigation,
    isAdmin,
    isInstructor,
    isOrgAdmin,
    pathname,
    t,
  ])
  const shouldShowPanelSwitcher = availablePanelLinks.length > 1

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => { setIsOpen(!isOpen); setActiveSubmenu(null); setIsOrgSwitcherOpen(false) }}
        className="flex items-center justify-center p-1 rounded-full transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div 
          className="relative h-10 w-10 flex items-center justify-center overflow-hidden rounded-full ring-2 ring-white/80 dark:ring-white/80 shadow-sm transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
            boxShadow: isOpen
              ? `0 0 20px color-mix(in srgb, ${accentColor} 28%, transparent)`
              : `0 4px 12px color-mix(in srgb, ${primaryColor} 22%, transparent)`,
          }}
        >
          {!isMounted ? (
            <span className="text-white text-xs font-bold tracking-wider">U</span>
          ) : (userProfile?.profile_picture_url || user?.profile_picture_url) && !imageError ? (
            <img 
              src={userProfile?.profile_picture_url || user?.profile_picture_url} 
              alt="Avatar" 
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-white text-xs font-bold tracking-wider">
              {getInitials()}
            </span>
          )}
          
          {/* Status Dot */}
          <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm" />
        </div>
      </motion.button>

      {/* Dropdown via Portal */}
      {isMounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/10"
                style={{ zIndex: USER_DROPDOWN_BACKDROP_Z_INDEX }}
                onClick={() => { setIsOpen(false); setActiveSubmenu(null); setIsOrgSwitcherOpen(false) }}
              />
              
              <motion.div
                id="global-user-dropdown-menu"
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="fixed w-[336px] max-w-[calc(100vw-2rem)] rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden bg-white/95 dark:bg-gray-800/95 border-gray-200 dark:border-white/10"
                style={{
                  zIndex: USER_DROPDOWN_MENU_Z_INDEX,
                  top: pos.top,
                  right: pos.right,
                }}
              >
              {/* Header - User Info */}
              <div 
                className="px-3.5 py-2.5 border-b border-gray-200 dark:border-white/5"
                style={{
                  backgroundColor: resolvedTheme === 'dark' ? 'rgb(15 20 25 / 0.82)' : 'rgb(248 250 252 / 0.88)'
                }}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white dark:ring-white/10 flex items-center justify-center shadow-sm flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                  >
                    {!isMounted ? (
                      <span className="text-white font-bold text-sm">U</span>
                    ) : (userProfile?.profile_picture_url || user?.profile_picture_url) && !imageError ? (
                      <img 
                        src={userProfile?.profile_picture_url || user?.profile_picture_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <span className="text-white font-bold text-sm">{getInitials()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 dark:text-white font-semibold text-[13px] truncate">
                      {getDisplayName()}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                      {getRoleLabel()}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={t('menu.profile')}
                    title={t('menu.profile')}
                    onClick={() => handleNavigation(profilePath)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {activeOrganization && (
                <div className="border-b border-gray-200 px-3.5 py-2.5 dark:border-white/5">
                  <div className="rounded-xl border border-gray-200 bg-gray-50/90 p-2.5 dark:border-white/10 dark:bg-white/5">
                    <div className="mb-2 flex items-center justify-between gap-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <OrganizationMark organization={activeOrganization} compact />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-white">
                            {getOrganizationDisplayName(activeOrganization)}
                          </p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {getOrganizationRoleLabel(activeOrganization.role)}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">
                        {t('profileDropdown.currentOrganization')}
                      </span>
                    </div>

                    {canSwitch && organizations.length > 1 && (
                      <div className="space-y-1">
                        <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {t('profileDropdown.quickSwitch')}
                        </p>
                        <button
                          type="button"
                          aria-expanded={isOrgSwitcherOpen}
                          onClick={() => {
                            setIsOrgSwitcherOpen((open) => !open)
                            setActiveSubmenu(null)
                          }}
                          className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-2.5 text-left text-xs font-semibold text-gray-800 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 dark:border-white/10 dark:bg-gray-900/80 dark:text-white dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/10"
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {getOrganizationDisplayName(activeOrganization)}
                          </span>
                          <ChevronRight
                            className={cn(
                              'h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform',
                              isOrgSwitcherOpen ? '-rotate-90' : 'rotate-90',
                            )}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {isOrgSwitcherOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900"
                            >
                              {organizations.map((organization) => {
                                const isActive = organization.id === activeOrganization.id

                                return (
                                  <button
                                    key={organization.id}
                                    type="button"
                                    onClick={() => handleOrganizationSwitch(organization)}
                                    className={cn(
                                      'flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors',
                                      isActive
                                        ? 'bg-emerald-50 text-gray-900 dark:bg-emerald-500/10 dark:text-white'
                                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5',
                                    )}
                                  >
                                    <OrganizationMark organization={organization} compact />
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-xs font-semibold">
                                        {getOrganizationDisplayName(organization)}
                                      </span>
                                      <span className="block truncate text-[11px] text-gray-500 dark:text-gray-400">
                                        {getOrganizationRoleLabel(organization.role)}
                                      </span>
                                    </span>
                                    {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
                                  </button>
                                )
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <select
                          aria-label={t('profileDropdown.quickSwitch')}
                          className="sr-only"
                          onChange={(event) => {
                            const targetOrganization = organizations.find(
                              (organization) => organization.id === event.target.value,
                            )
                            if (targetOrganization) {
                              handleOrganizationSwitch(targetOrganization)
                            }
                          }}
                          value={activeOrganization.id}
                        >
                          {organizations.map((organization) => (
                            <option key={organization.id} value={organization.id}>
                              {getOrganizationDisplayName(organization)} · {getOrganizationRoleLabel(organization.role)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {shouldShowPanelSwitcher && (
                <PanelSwitcher
                  items={availablePanelLinks}
                  label={t('profileDropdown.panels.title')}
                />
              )}

              {/* Menu Items */}
              <div className="py-1.5 space-y-0.5">
                {!shouldShowPanelSwitcher && (
                  <MenuItem
                    icon={LayoutDashboard}
                    label={t('menu.userPanel')}
                    onClick={handleUserDashboardNavigation}
                  />
                )}

                {/* Organizations */}
                {isB2B && (
                  <MenuItem 
                    icon={BriefcaseBusiness}
                    label={canSwitch ? t('profileDropdown.viewAllOrganizations') : t('profileDropdown.organizations')}
                    onClick={() => handleNavigation('/auth/select-organization')} 
                  />
                )}

                {/* Theme Toggle */}
                <MenuItem
                  icon={resolvedTheme === 'dark' ? Sun : Moon}
                  label={isMounted ? (
                    resolvedTheme === 'dark' ? t('menu.theme.light') : t('menu.theme.dark')
                  ) : '...'}
                  onClick={handleThemeToggle}
                />

                {/* Language submenu */}
                <div className="relative">
                  <MenuItem 
                    icon={Globe} 
                    label={isMounted ? t('menu.languages.title') : '...'} 
                    rightElement={
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-[#8B95A5]">{language.toUpperCase()}</span>
                        <ChevronRight className={`w-3.5 h-3.5 text-[#8B95A5] transition-transform ${activeSubmenu === 'language' ? 'rotate-90' : ''}`} />
                      </div>
                    }
                    onClick={() => setActiveSubmenu(activeSubmenu === 'language' ? null : 'language')}
                  />
                  <AnimatePresence>
                    {activeSubmenu === 'language' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="py-1 px-3 space-y-0.5">
                          {languageOptions.map((opt) => {
                            const isActive = language === opt.value
                            return (
                              <button
                                key={opt.value}
                                onClick={() => { setLanguage(opt.value); setActiveSubmenu(null) }}
                                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                                  isActive ? 'bg-[#00D4B3]/15 text-[#00D4B3]' : 'text-[#8B95A5] hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span>{opt.flag}</span>
                                  <span>{isMounted ? t(`menu.languages.${opt.value}`) : '...'}</span>
                                </span>
                                {isActive && <Check className="w-3 h-3 ml-auto" />}
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer - Logout */}
              <div className="px-2 py-2 border-t border-gray-200 dark:border-white/5">
                <motion.button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-all"
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut className="w-[18px] h-[18px]" />
                  <span>{t('menu.logout')}</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )}
    </div>
  )
})

// Reusable MenuItem component — compact, no icon backgrounds
interface OrganizationMarkProps {
  organization: Organization
  compact?: boolean
}

function OrganizationMark({ organization, compact = false }: OrganizationMarkProps) {
  const logoUrl = organization.brandLogoUrl || organization.logoUrl
  const sizeClassName = compact ? 'h-8 w-8 rounded-lg text-xs' : 'h-10 w-10 rounded-xl text-sm'
  const brandColor = organization.brandColorPrimary || 'var(--color-primary)'
  const organizationLabel =
    organization.name?.trim() ||
    organization.slug?.trim() ||
    organization.id?.trim() ||
    'O'

  if (logoUrl) {
    return (
      <span className={cn('shrink-0 overflow-hidden bg-gray-100 ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-white/10', sizeClassName)}>
        <img src={logoUrl} alt="" className="h-full w-full object-cover" />
      </span>
    )
  }

  return (
    <span
      className={cn('flex shrink-0 items-center justify-center font-bold text-white shadow-sm', sizeClassName)}
      style={{ background: `linear-gradient(135deg, ${brandColor}, var(--color-accent))` }}
      aria-hidden="true"
    >
      {organizationLabel.charAt(0).toUpperCase()}
    </span>
  )
}

interface PanelSwitcherItem {
  id: string
  icon: LucideIcon
  label: string
  isActive: boolean
  onClick: () => void
}

interface PanelSwitcherProps {
  items: PanelSwitcherItem[]
  label: string
}

function PanelSwitcher({ items, label }: PanelSwitcherProps) {
  const gridClassName = items.length >= 4 ? 'grid-cols-2' : items.length === 3 ? 'grid-cols-3' : 'grid-cols-2'

  return (
    <div className="border-b border-gray-200 px-3.5 py-2.5 dark:border-white/5">
      <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <div className={cn('grid gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-900/70', gridClassName)}>
        {items.map((item) => {
          const Icon = item.icon

          return (
            <button
              key={item.id}
              type="button"
              aria-current={item.isActive ? 'page' : undefined}
              onClick={item.onClick}
              className={cn(
                'flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
                item.isActive
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200 dark:bg-white/10 dark:text-white dark:ring-white/10'
                  : 'text-gray-600 hover:bg-white/70 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
              )}
            >
              <Icon
                className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  item.isActive ? 'text-emerald-500' : 'text-gray-400',
                )}
              />
              <span className="min-w-0 truncate">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface MenuItemProps {
  icon: LucideIcon
  label: string
  onClick: () => void
  rightElement?: React.ReactNode
  highlight?: boolean
}

function MenuItem({ icon: Icon, label, onClick, rightElement, highlight }: MenuItemProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2 mx-0.5 rounded-xl transition-all group text-sm",
        highlight 
          ? "text-[#00D4B3] hover:bg-[#00D4B3]/10 font-semibold" 
          : "text-gray-700 dark:text-[#C8CDD5] hover:bg-black/5 dark:hover:bg-white/5 font-medium"
      )}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className={cn(
        "w-[18px] h-[18px] flex-shrink-0",
        highlight ? "text-[#00D4B3]" : "text-[#8B95A5] group-hover:text-[#00D4B3]"
      )} />
      <span className="flex-1 text-left">{label}</span>
      {rightElement}
    </motion.button>
  )
}
