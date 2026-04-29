'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../features/auth/hooks/useAuth'
import { useUserProfile } from '../../../features/auth/hooks/useUserProfile'
import { useThemeStore, Theme } from '../../stores/themeStore'
import { useLanguage } from '../../providers/I18nProvider'

// Lucide Icons
import {
  User,
  BarChart3,
  BookOpen,
  Pencil,
  Moon,
  Sun,
  Monitor,
  LogOut,
  ChevronRight,
  Shield,
  GraduationCap,
  Settings,
  Award,
  Bell,
  Globe,
  ExternalLink,
  LucideIcon,
  Check,
  Building2,
  Users
} from 'lucide-react'
import { useOrganization } from '../../hooks/useOrganization'

interface UserDropdownProps {
  className?: string
}

export const UserDropdown = React.memo(function UserDropdown({ className = '' }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()
  const { userProfile } = useUserProfile()
  const { theme, setTheme, resolvedTheme, initializeTheme } = useThemeStore()
  const { language, setLanguage } = useLanguage()
  const { organizations, currentOrganization, isB2B, switchOrganization } = useOrganization()
  const router = useRouter()
  const { t } = useTranslation('common')
  


  useEffect(() => {
    initializeTheme()
  }, [initializeTheme])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setActiveSubmenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isAdmin = useMemo(() => user?.cargo_rol?.toLowerCase() === 'administrador', [user?.cargo_rol])
  const isInstructor = useMemo(() => user?.cargo_rol?.toLowerCase() === 'instructor', [user?.cargo_rol])

  const handleLogout = useCallback(async () => {
    await logout()
    setIsOpen(false)
  }, [logout])

  const handleNavigation = useCallback((path: string) => {
    router.push(path)
    setIsOpen(false)
    setActiveSubmenu(null)
  }, [router])



  const getDisplayName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`
    }
    return userProfile?.display_name || user?.display_name || userProfile?.first_name || t('profileDropdown.userFallback')
  }

  const getUsername = () => userProfile?.username || user?.username || t('profileDropdown.usernameFallback')

  const getInitials = () => {
    const name = getDisplayName()
    const parts = name.split(' ').filter(Boolean)
    if (parts.length === 0) return 'U'
    return parts.map(n => n[0] || '').join('').toUpperCase().slice(0, 2)
  }

  const languageOptions = [
    { value: 'es' as const, label: t('languages.es'), flag: '🇪🇸' },
    { value: 'en' as const, label: t('languages.en'), flag: '🇺🇸' },
    { value: 'pt' as const, label: t('languages.pt'), flag: '🇧🇷' },
  ]

  const themeOptions = [
    { value: 'light' as Theme, label: t('menu.theme.light'), icon: Sun },
    { value: 'dark' as Theme, label: t('menu.theme.dark'), icon: Moon },
    { value: 'system' as Theme, label: t('menu.theme.system'), icon: Monitor },
  ]

  const getCurrentThemeIcon = () => {
    if (theme === 'system') return Monitor
    return resolvedTheme === 'dark' ? Moon : Sun
  }

  const getCurrentLanguageFlag = () => {
    return languageOptions.find(l => l.value === language)?.flag || '🌐'
  }

  const getOrgRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return t('profileDropdown.orgRoles.owner')
      case 'admin': return t('profileDropdown.orgRoles.admin')
      default: return t('profileDropdown.orgRoles.member')
    }
  }

  const handleSwitchOrg = useCallback((orgIdOrSlug: string) => {
    switchOrganization(orgIdOrSlug)
    setIsOpen(false)
    setActiveSubmenu(null)
  }, [switchOrganization])

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => { setIsOpen(!isOpen); setActiveSubmenu(null) }}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-all duration-200"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="relative">
          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#00D4B3]/30 hover:ring-[#00D4B3]/60 transition-all duration-300">
            {userProfile?.profile_picture_url ? (
              <img 
                src={userProfile.profile_picture_url} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center">
                <span className="text-white text-xs font-semibold">{getInitials()}</span>
              </div>
            )}
          </div>
          
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10B981] rounded-full border-2 border-[#0F1419]" />
        </div>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => { setIsOpen(false); setActiveSubmenu(null) }}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="absolute right-0 top-full mt-2 w-64 bg-[#1A1F25] rounded-xl shadow-2xl border border-[#2A3038] z-50 overflow-hidden"
            >
              {/* Header - User Info */}
              <div className="p-4 bg-gradient-to-r from-[#0A2540] to-[#0A2540]/80 border-b border-[#2A3038]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-[#00D4B3]/40">
                    {userProfile?.profile_picture_url ? (
                      <img src={userProfile.profile_picture_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#00D4B3] to-[#00A896] flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">{getInitials()}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm truncate">{getDisplayName()}</h3>
                    <p className="text-[#8B95A5] text-xs truncate">@{getUsername()}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Row */}
              <div className="p-2 border-b border-[#2A3038] flex gap-1">
                <motion.button
                  onClick={() => handleNavigation('/profile')}
                  className="flex-1 flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#2A3038] flex items-center justify-center group-hover:bg-[#00D4B3]/20 transition-colors">
                    <Pencil className="w-4 h-4 text-[#8B95A5] group-hover:text-[#00D4B3] transition-colors" />
                  </div>
                  <span className="text-[10px] text-[#8B95A5] group-hover:text-white transition-colors">{t('menu.profile')}</span>
                </motion.button>

                <motion.button
                  onClick={() => handleNavigation('/account-settings')}
                  className="flex-1 flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#2A3038] flex items-center justify-center group-hover:bg-[#00D4B3]/20 transition-colors">
                    <Settings className="w-4 h-4 text-[#8B95A5] group-hover:text-[#00D4B3] transition-colors" />
                  </div>
                  <span className="text-[10px] text-[#8B95A5] group-hover:text-white transition-colors">{t('menu.account')}</span>
                </motion.button>

                <motion.button
                  onClick={() => handleNavigation('/dashboard/notifications')}
                  className="flex-1 flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative w-8 h-8 rounded-lg bg-[#2A3038] flex items-center justify-center group-hover:bg-[#00D4B3]/20 transition-colors">
                    <Bell className="w-4 h-4 text-[#8B95A5] group-hover:text-[#00D4B3] transition-colors" />
                  </div>
                  <span className="text-[10px] text-[#8B95A5] group-hover:text-white transition-colors">{t('menu.notifications')}</span>
                </motion.button>

              </div>

              {/* Menu Items */}
              <div className="py-1">
                {/* Learning Section */}
                <MenuItem icon={BookOpen} label={t('menu.myCourses')} onClick={() => handleNavigation('/dashboard')} />
                <MenuItem icon={BarChart3} label={t('menu.stats')} onClick={() => handleNavigation('/statistics')} />
                <MenuItem icon={Award} label={t('menu.certificates')} onClick={() => handleNavigation('/certificates')} />
                
                {/* Mis Organizaciones - solo B2B */}
                {isB2B && organizations.length > 0 && (
                  <>
                    <div className="h-px bg-[#2A3038] mx-3 my-1" />
                    <div className="relative">
                      <MenuItem
                        icon={Building2}
                        label={t('profileDropdown.organizations')}
                        rightElement={
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-[#8B95A5]">{organizations.length}</span>
                            <ChevronRight className={`w-3.5 h-3.5 text-[#8B95A5] transition-transform ${activeSubmenu === 'orgs' ? 'rotate-90' : ''}`} />
                          </div>
                        }
                        onClick={() => setActiveSubmenu(activeSubmenu === 'orgs' ? null : 'orgs')}
                      />
                      <AnimatePresence>
                        {activeSubmenu === 'orgs' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="py-1 px-3 space-y-0.5">
                              {organizations.map((org) => {
                                const isCurrent = currentOrganization?.id === org.id
                                return (
                                  <button
                                    key={org.id}
                                    onClick={() => handleSwitchOrg(org.id)}
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                                      isCurrent
                                        ? 'bg-[#00D4B3]/15 text-[#00D4B3]'
                                        : 'text-[#8B95A5] hover:bg-white/5 hover:text-white'
                                    }`}
                                  >
                                    {/* Logo / Initial */}
                                    <div
                                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 overflow-hidden text-white"
                                      style={{ backgroundColor: org.brandColorPrimary || '#0A2540' }}
                                    >
                                      {org.brandLogoUrl || org.logoUrl ? (
                                        <img
                                          src={org.brandLogoUrl || org.logoUrl || ''}
                                          alt={org.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-[9px] font-bold leading-none">
                                          {org.name.charAt(0).toUpperCase()}
                                        </span>
                                      )}
                                    </div>

                                    {/* Name */}
                                    <span className="flex-1 text-left truncate">{org.name}</span>

                                    {/* Role badge */}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 flex-shrink-0 ${
                                      org.role === 'owner' || org.role === 'admin'
                                        ? 'bg-blue-500/15 text-blue-400'
                                        : 'bg-emerald-500/15 text-emerald-400'
                                    }`}>
                                      {org.role === 'owner' || org.role === 'admin'
                                        ? <Shield className="w-2.5 h-2.5" />
                                        : <Users className="w-2.5 h-2.5" />
                                      }
                                      {getOrgRoleLabel(org.role)}
                                    </span>

                                    {/* Current indicator */}
                                    {isCurrent && <Check className="w-3 h-3 ml-0.5 flex-shrink-0" />}
                                  </button>
                                )
                              })}

                              {/* Ver todas link */}
                              <button
                                onClick={() => { handleNavigation('/auth/select-organization') }}
                                className="w-full flex items-center justify-center gap-1 px-2 py-1.5 mt-1 rounded-lg text-[10px] text-[#8B95A5] hover:text-[#00D4B3] transition-colors border-t border-[#2A3038] pt-2"
                              >
                                {t('profileDropdown.viewAllOrganizations')}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}

                <div className="h-px bg-[#2A3038] mx-3 my-1" />

                {/* Preferences */}
                <div className="relative">
                  <MenuItem
                    icon={getCurrentThemeIcon()}
                    label={t('profileDropdown.theme')} 
                    rightElement={
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-[#8B95A5]">
                          {themeOptions.find((option) => option.value === theme)?.label || t('menu.theme.system')}
                        </span>
                        <ChevronRight className={`w-3.5 h-3.5 text-[#8B95A5] transition-transform ${activeSubmenu === 'theme' ? 'rotate-90' : ''}`} />
                      </div>
                    }
                    onClick={() => setActiveSubmenu(activeSubmenu === 'theme' ? null : 'theme')}
                  />
                  <AnimatePresence>
                    {activeSubmenu === 'theme' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="py-1 px-3 space-y-0.5">
                          {themeOptions.map((opt) => {
                            const ThemeIcon = opt.icon
                            const isActive = theme === opt.value
                            return (
                              <button
                                key={opt.value}
                                onClick={() => { setTheme(opt.value); setActiveSubmenu(null) }}
                                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                                  isActive ? 'bg-[#00D4B3]/15 text-[#00D4B3]' : 'text-[#8B95A5] hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <ThemeIcon className="w-3.5 h-3.5" />
                                <span>{opt.label}</span>
                                {isActive && <Check className="w-3 h-3 ml-auto" />}
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative">
                  <MenuItem 
                    icon={Globe} 
                    label={t('language')} 
                    rightElement={
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{getCurrentLanguageFlag()}</span>
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
                                <span className="text-sm">{opt.flag}</span>
                                <span>{opt.label}</span>
                                {isActive && <Check className="w-3 h-3 ml-auto" />}
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>



                {/* Admin/Instructor Panels */}
                {(isAdmin || isInstructor) && (
                  <>
                    <div className="h-px bg-[#2A3038] mx-3 my-1" />
                    {isAdmin && (
                      <MenuItem 
                        icon={Shield} 
                        label={t('menu.adminPanel')} 
                        onClick={() => handleNavigation('/admin/dashboard')} 
                        highlight 
                      />
                    )}
                    {isInstructor && (
                      <MenuItem 
                        icon={GraduationCap} 
                        label={t('menu.instructorPanel')} 
                        onClick={() => handleNavigation('/instructor/dashboard')} 
                        highlight 
                      />
                    )}
                  </>
                )}
              </div>

              {/* Footer - Logout */}
              <div className="p-2 border-t border-[#2A3038]">
                <motion.button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('menu.logout')}</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
})

// Reusable MenuItem component
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
      className={`w-full flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg transition-all group ${
        highlight 
          ? 'text-[#00D4B3] hover:bg-[#00D4B3]/10' 
          : 'text-[#E0E4EA] hover:bg-white/5'
      }`}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.99 }}
    >
      <Icon className={`w-4 h-4 ${highlight ? 'text-[#00D4B3]' : 'text-[#8B95A5] group-hover:text-[#00D4B3] transition-colors'}`} />
      <span className="flex-1 text-left text-sm">{label}</span>
      {rightElement}
    </motion.button>
  )
}
