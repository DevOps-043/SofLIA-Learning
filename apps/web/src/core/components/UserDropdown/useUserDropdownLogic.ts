'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../features/auth/hooks/useAuth'
import { useUserProfile } from '../../../features/auth/hooks/useUserProfile'
import { useOrganization } from '../../hooks/useOrganization'
import { useLanguage } from '../../providers/I18nProvider'
import { useThemeStore } from '../../stores/themeStore'
import { resolveOrganizationBrandColors } from '../../theme/organization-brand-colors'
import { getOrganizationUserDashboardPath } from '../../utils/organizationNavigation'
import {
  getUserDisplayName,
  getUserInitials,
  getUserRoleLabel,
  type DropdownUserLike,
} from './display'
import { USER_DROPDOWN_CLOSE_EVENT } from './types'

interface UserDropdownLogicOptions {
  certificatesCount?: number
  onAnalyticsClick?: () => void
  onCertificatesClick?: () => void
  onLogout?: () => void | Promise<void>
  onProfileClick?: () => void
}

const MOBILE_DROPDOWN_TOP_PX = 64
const MOBILE_DROPDOWN_MEDIA_QUERY = '(max-width: 767px)'

export function useUserDropdownLogic(userProp?: unknown, options: UserDropdownLogicOptions = {}) {
  const { certificatesCount = 0, onAnalyticsClick, onCertificatesClick, onLogout, onProfileClick } = options
  const [isOpen, setIsOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [imageError, setImageError] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user: authUser, logout } = useAuth()
  const user = (userProp || authUser) as DropdownUserLike | null
  const { userProfile } = useUserProfile()
  const { theme, setTheme, resolvedTheme, initializeTheme } = useThemeStore()
  const { language, setLanguage } = useLanguage()
  const [isOrgSwitcherOpen, setIsOrgSwitcherOpen] = useState(false)
  const { currentOrganization, organizations, canSwitch, isB2B, isOrgAdmin, switchOrganization } = useOrganization()
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation('common')

  useEffect(() => { setIsMounted(true); initializeTheme() }, [initializeTheme])
  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_DROPDOWN_MEDIA_QUERY)
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches)

    syncViewport()
    mediaQuery.addEventListener('change', syncViewport)
    return () => mediaQuery.removeEventListener('change', syncViewport)
  }, [])
  useEffect(() => setImageError(false), [userProfile?.profile_picture_url, user?.profile_picture_url])
  useEffect(() => {
    if (!isOpen) return
    if (isMobileViewport) {
      setPos({ top: MOBILE_DROPDOWN_TOP_PX, right: 0 })
      return
    }
    if (!dropdownRef.current) return
    const rect = dropdownRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
  }, [isMobileViewport, isOpen])
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const menu = document.getElementById('global-user-dropdown-menu')
      if (dropdownRef.current?.contains(event.target as Node) || menu?.contains(event.target as Node)) return
      setIsOpen(false); setActiveSubmenu(null); setIsOrgSwitcherOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  useEffect(() => {
    const closeDropdown = () => {
      setIsOpen(false); setActiveSubmenu(null); setIsOrgSwitcherOpen(false)
    }
    window.addEventListener(USER_DROPDOWN_CLOSE_EVENT, closeDropdown)
    return () => window.removeEventListener(USER_DROPDOWN_CLOSE_EVENT, closeDropdown)
  }, [])

  const isAdmin = useMemo(() => user?.cargo_rol?.toLowerCase() === 'administrador', [user?.cargo_rol])
  const isInstructor = useMemo(() => user?.cargo_rol?.toLowerCase() === 'instructor', [user?.cargo_rol])
  const profilePath = useMemo(() => currentOrganization?.slug ? `/${currentOrganization.slug}/profile` : '/profile', [currentOrganization?.slug])
  const handleNavigation = useCallback((path: string) => {
    router.push(path); setIsOpen(false); setActiveSubmenu(null); setIsOrgSwitcherOpen(false)
  }, [router])
  const handleLogout = useCallback(async () => {
    if (onLogout) {
      await onLogout()
    } else {
      await logout()
    }
    setIsOpen(false); setActiveSubmenu(null); setIsOrgSwitcherOpen(false)
  }, [logout, onLogout])
  const handleProfileClick = useCallback(() => {
    if (onProfileClick) {
      onProfileClick(); setIsOpen(false); setActiveSubmenu(null); setIsOrgSwitcherOpen(false)
      return
    }
    handleNavigation(profilePath)
  }, [handleNavigation, onProfileClick, profilePath])
  const handleOptionalAction = useCallback((action?: () => void) => {
    if (!action) return
    action(); setIsOpen(false); setActiveSubmenu(null); setIsOrgSwitcherOpen(false)
  }, [])
  const handleOrganizationSwitch = useCallback((slug: string) => {
    switchOrganization(slug); setIsOpen(false); setActiveSubmenu(null); setIsOrgSwitcherOpen(false)
  }, [switchOrganization])
  const handleUserDashboardNavigation = useCallback(() => {
    handleNavigation(currentOrganization?.slug ? getOrganizationUserDashboardPath(currentOrganization.slug) : '/dashboard')
  }, [currentOrganization?.slug, handleNavigation])
  const userStatsPath = useMemo(() => {
    if (currentOrganization?.slug) return `/${currentOrganization.slug}/business-user/analytics`
    return isAdmin ? '/admin/statistics' : null
  }, [currentOrganization?.slug, isAdmin])
  const displayName = getUserDisplayName(userProfile, user, t('profileDropdown.userFallback'))
  const initials = getUserInitials(displayName)
  const roleLabel = getUserRoleLabel({ isAdmin, isInstructor, isOrgAdmin, orgAdminLabel: t('profileDropdown.orgRoles.admin'), user })
  const imageUrl = userProfile?.profile_picture_url || user?.profile_picture_url
  // Gateado por brandingEnabled: con el branding apagado el menú usa la paleta
  // de plataforma, aunque la organización conserve sus colores en la BD.
  const { primaryColor, accentColor } = resolveOrganizationBrandColors(currentOrganization)

  return {
    activeSubmenu, accentColor, canSwitch, currentOrganization, displayName, dropdownRef,
    certificatesCount,
    handleAnalyticsClick: () => handleOptionalAction(onAnalyticsClick),
    handleCertificatesClick: () => handleOptionalAction(onCertificatesClick),
    handleLogout, handleNavigation, handleOrganizationSwitch, handleProfileClick, handleUserDashboardNavigation,
    imageError, imageUrl, initials, isAdmin, isB2B, isInstructor, isMounted, isOpen,
    isMobileViewport, isOrgAdmin, isOrgSwitcherOpen, language, organizations, pathname, pos, primaryColor,
    showAnalyticsAction: Boolean(onAnalyticsClick),
    showCertificatesAction: Boolean(onCertificatesClick),
    profilePath, resolvedTheme, roleLabel, setActiveSubmenu, setImageError, setIsOpen,
    setIsOrgSwitcherOpen, setLanguage, setTheme, theme,
    t, toggleTheme: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
    userStatsPath,
  }
}
