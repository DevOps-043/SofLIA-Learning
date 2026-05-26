'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../features/auth/hooks/useAuth'
import { useUserProfile } from '../../../features/auth/hooks/useUserProfile'
import { useOrganization } from '../../hooks/useOrganization'
import { useLanguage } from '../../providers/I18nProvider'
import { useThemeStore } from '../../stores/themeStore'
import { getOrganizationUserDashboardPath } from '../../utils/organizationNavigation'
import {
  getUserDisplayName,
  getUserInitials,
  getUserRoleLabel,
  type DropdownUserLike,
} from './display'

export function useUserDropdownLogic(userProp?: unknown) {
  const [isOpen, setIsOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [imageError, setImageError] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user: authUser, logout } = useAuth()
  const user = (userProp || authUser) as DropdownUserLike | null
  const { userProfile } = useUserProfile()
  const { setTheme, resolvedTheme, initializeTheme } = useThemeStore()
  const { language, setLanguage } = useLanguage()
  const [isOrgSwitcherOpen, setIsOrgSwitcherOpen] = useState(false)
  const { currentOrganization, organizations, canSwitch, isB2B, isOrgAdmin, switchOrganization } = useOrganization()
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation('common')

  useEffect(() => { setIsMounted(true); initializeTheme() }, [initializeTheme])
  useEffect(() => setImageError(false), [userProfile?.profile_picture_url, user?.profile_picture_url])
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return
    const rect = dropdownRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
  }, [isOpen])
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const menu = document.getElementById('global-user-dropdown-menu')
      if (dropdownRef.current?.contains(event.target as Node) || menu?.contains(event.target as Node)) return
      setIsOpen(false); setActiveSubmenu(null); setIsOrgSwitcherOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isAdmin = useMemo(() => user?.cargo_rol?.toLowerCase() === 'administrador', [user?.cargo_rol])
  const isInstructor = useMemo(() => user?.cargo_rol?.toLowerCase() === 'instructor', [user?.cargo_rol])
  const handleNavigation = useCallback((path: string) => {
    router.push(path); setIsOpen(false); setActiveSubmenu(null); setIsOrgSwitcherOpen(false)
  }, [router])
  const handleLogout = useCallback(async () => {
    await logout(); setIsOpen(false); setIsOrgSwitcherOpen(false)
  }, [logout])
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
  const profilePath = useMemo(() => currentOrganization?.slug ? `/${currentOrganization.slug}/profile` : '/profile', [currentOrganization?.slug])
  const displayName = getUserDisplayName(userProfile, user, t('profileDropdown.userFallback'))
  const initials = getUserInitials(displayName)
  const roleLabel = getUserRoleLabel({ isAdmin, isInstructor, isOrgAdmin, orgAdminLabel: t('profileDropdown.orgRoles.admin'), user })
  const imageUrl = userProfile?.profile_picture_url || user?.profile_picture_url
  const primaryColor = currentOrganization?.brandColorPrimary || 'var(--color-primary)'
  const accentColor = 'var(--color-accent)'

  return {
    activeSubmenu, accentColor, canSwitch, currentOrganization, displayName, dropdownRef,
    handleLogout, handleNavigation, handleOrganizationSwitch, handleUserDashboardNavigation,
    imageError, imageUrl, initials, isAdmin, isB2B, isInstructor, isMounted, isOpen,
    isOrgAdmin, isOrgSwitcherOpen, language, organizations, pathname, pos, primaryColor,
    profilePath, resolvedTheme, roleLabel, setActiveSubmenu, setImageError, setIsOpen,
    setIsOrgSwitcherOpen, setLanguage,
    t, toggleTheme: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
    userStatsPath,
  }
}
