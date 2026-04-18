'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { 
  ArrowRightOnRectangleIcon, 
  ChevronDownIcon, 
  ShieldCheckIcon, 
  ChevronRightIcon,
  AcademicCapIcon,
  UserIcon,
  GlobeAltIcon,
  LanguageIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../auth/hooks/useAuth'
import { useThemeStore, Theme } from '@/core/stores/themeStore'

interface AdminUserDropdownProps {
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
    profile_picture_url?: string
    cargo_rol: string
    organization?: {
      name: string
      slug: string
    }
  }
}

export function AdminUserDropdown({ user }: AdminUserDropdownProps) {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false)
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const handleAvatarError = useCallback(() => setAvatarError(true), [])
  const router = useRouter()
  const { logout } = useAuth()
  const { t, i18n } = useTranslation()
  const { theme, setTheme, initializeTheme } = useThemeStore()
  const themeMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initializeTheme()
  }, [initializeTheme])

  // Cerrar menú de tema al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false)
      }
    }

    if (isThemeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isThemeMenuOpen])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth')
    } catch (error) {
    }
  }



  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    setIsThemeMenuOpen(false)
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />
      case 'dark':
        return <Moon className="w-4 h-4" />
      case 'system':
        return <Monitor className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Modo Claro'
      case 'dark':
        return 'Modo Oscuro'
      case 'system':
        return 'Seguir Sistema'
      default:
        return 'Seguir Sistema'
    }
  }

  const getInitials = () => {
    const firstName = user.first_name || ''
    const lastName = user.last_name || ''
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getDisplayName = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user.email
  }

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    setIsLangMenuOpen(false)
  }

  return (
    <Menu as="div" className="relative">
      {({ open }) => (
        <>
          <Menu.Button
            id="tour-user-dropdown-trigger"
            className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 group outline-none"
          >
            {/* Avatar */}
            <div className="relative">
              {user.profile_picture_url && !avatarError ? (
                <motion.img
                  src={user.profile_picture_url}
                  alt={getDisplayName()}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-[#E9ECEF] dark:ring-[#334155] group-hover:ring-[#0A2540] dark:group-hover:ring-[#00D4B3] transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  onError={handleAvatarError}
                />
              ) : (
                <motion.div
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-[#0A2540]/20"
                  whileHover={{ scale: 1.05 }}
                >
                  {getInitials()}
                </motion.div>
              )}
              {/* Status Indicator */}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#10B981] border-2 border-white dark:border-[#0F1419] rounded-full"></div>
            </div>

            {/* User Info - Desktop */}
            <div className="hidden md:block text-left mr-1">
              <p className="text-sm font-bold text-[#0A2540] dark:text-white leading-none mb-1">
                {getDisplayName()}
              </p>
              <p className="text-[11px] font-medium text-[#0A2540] dark:text-[#00D4B3] uppercase tracking-wider leading-none">
                {user.cargo_rol}
              </p>
            </div>

            {/* Chevron */}
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ChevronDownIcon 
                className="w-4 h-4 text-[#6C757D] dark:text-gray-400 group-hover:text-[#0A2540] dark:group-hover:text-white transition-colors" 
              />
            </motion.div>
          </Menu.Button>

          <Transition
            enter="transition ease-out duration-200"
            enterFrom="transform opacity-0 scale-95 translate-y-2"
            enterTo="transform opacity-100 scale-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="transform opacity-100 scale-100 translate-y-0"
            leaveTo="transform opacity-0 scale-95 translate-y-2"
          >
        <Menu.Items className="absolute right-0 mt-3 w-[260px] origin-top-right bg-white dark:bg-[#1E2329] rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40 border border-[#E9ECEF] dark:border-[#334155] focus:outline-none overflow-hidden z-[120]">
          
          {/* Header del Dropdown */}
          <div className="p-4 border-b border-[#E9ECEF] dark:border-[#334155] bg-[#F8FAFC]/50 dark:bg-[#0A0D12]/30">
            <div className="flex items-center gap-3 mb-2">
              {user.profile_picture_url && !avatarError ? (
                <img
                  src={user.profile_picture_url}
                  alt={getDisplayName()}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-[#E9ECEF] dark:ring-[#334155]"
                  onError={handleAvatarError}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center text-white text-xs font-bold">
                  {getInitials()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#0A2540] dark:text-white truncate">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-[#6C757D] dark:text-gray-400 truncate font-medium">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#0A2540]/10 text-[#0A2540] uppercase tracking-wider border border-[#0A2540]/20 dark:bg-[#00D4B3]/10 dark:text-[#00D4B3] dark:border-[#00D4B3]/20">
              {user.cargo_rol}
            </div>
          </div>

          <div className="p-2 space-y-1">
            {/* Panel de Administración */}
            {user.cargo_rol?.toLowerCase() === 'administrador' && (
              <>
                <Menu.Item>
                  {({ active }) => (
                    <Link href="/admin/dashboard">
                      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        active 
                          ? 'bg-[#0A2540]/5 text-[#0A2540] dark:bg-[#00D4B3]/5 dark:text-[#00D4B3]'
                          : 'text-[#0A2540] dark:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#334155]/50'
                      }`}>
                        <ShieldCheckIcon className={`w-5 h-5 ${active ? 'text-[#0A2540] dark:text-[#00D4B3]' : 'text-[#6C757D] dark:text-gray-400'}`} />
                        <span className="text-sm font-medium">Panel de Administración</span>
                      </div>
                    </Link>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <Link href="/auth/select-organization">
                      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        active 
                          ? 'bg-[#0A2540]/5 text-[#0A2540] dark:bg-[#00D4B3]/5 dark:text-[#00D4B3]'
                          : 'text-[#0A2540] dark:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#334155]/50'
                      }`}>
                        <GlobeAltIcon className={`w-5 h-5 ${active ? 'text-[#0A2540] dark:text-[#00D4B3]' : 'text-[#6C757D] dark:text-gray-400'}`} />
                        <span className="text-sm font-medium">Mis organizaciones</span>
                      </div>
                    </Link>
                  )}
                </Menu.Item>
              </>
            )}

            {/* Crear Plan de Estudio */}
            <Menu.Item>
              {({ active }) => (
                <Link href="/study-planner/create">
                  <div id="tour-dropdown-create-plan" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    active 
                      ? 'bg-[#0A2540]/5 text-[#0A2540] dark:bg-[#00D4B3]/5 dark:text-[#00D4B3]'
                      : 'text-[#0A2540] dark:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#334155]/50'
                  }`}>
                    <AcademicCapIcon className={`w-5 h-5 ${active ? 'text-[#0A2540] dark:text-[#00D4B3]' : 'text-[#6C757D] dark:text-gray-400'}`} />
                    <span className="text-sm font-medium">Crear Plan de Estudio</span>
                  </div>
                </Link>
              )}
            </Menu.Item>

            {/* Editar Perfil */}
            <Menu.Item>
              {({ active }) => (
                <Link href="/profile">
                  <div id="tour-dropdown-edit-profile" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    active 
                      ? 'bg-[#0A2540]/5 text-[#0A2540] dark:bg-[#00D4B3]/5 dark:text-[#00D4B3]'
                      : 'text-[#0A2540] dark:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#334155]/50'
                  }`}>
                    <UserIcon className={`w-5 h-5 ${active ? 'text-[#0A2540] dark:text-[#00D4B3]' : 'text-[#6C757D] dark:text-gray-400'}`} />
                    <span className="text-sm font-medium">Editar perfil</span>
                  </div>
                </Link>
              )}
            </Menu.Item>

            {/* Idioma / Language */}
            <Menu.Item>
              {({ active }) => (
                <div className="relative">
                  <button
                    id="tour-dropdown-language"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsLangMenuOpen(!isLangMenuOpen);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      active || isLangMenuOpen
                        ? 'bg-[#F8FAFC] dark:bg-[#334155]/50 text-[#0A2540] dark:text-white'
                        : 'text-[#0A2540] dark:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 flex items-center justify-center ${active || isLangMenuOpen ? 'text-[#0A2540] dark:text-white' : 'text-[#6C757D] dark:text-gray-400'}`}>
                        <GlobeAltIcon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">Idioma / Language</span>
                    </div>
                    <ChevronRightIcon className={`w-4 h-4 text-[#6C757D] dark:text-gray-400 transition-transform duration-200 ${isLangMenuOpen ? 'rotate-90' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isLangMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-[#F8FAFC] dark:bg-[#0A0D12]/30 rounded-xl mt-1 border border-[#E9ECEF] dark:border-[#334155]"
                      >
                        {[
                          { value: 'es', label: 'Español' },
                          { value: 'en', label: 'English' },
                          { value: 'pt', label: 'Português' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={(e) => {
                              e.preventDefault();
                              handleLanguageChange(option.value);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-colors ${
                              i18n.language === option.value
                                ? 'text-[#0A2540] bg-[#0A2540]/5 dark:text-[#00D4B3] dark:bg-[#00D4B3]/5'
                                : 'text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white'
                            }`}
                          >
                            <span className="uppercase">{option.value}</span>
                            {option.label}
                            {i18n.language === option.value && <Check className="w-3 h-3 ml-auto" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </Menu.Item>

            {/* Selector de Tema */}
            <Menu.Item>
              {({ active }) => (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setIsThemeMenuOpen(!isThemeMenuOpen);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      active || isThemeMenuOpen
                        ? 'bg-[#F8FAFC] dark:bg-[#334155]/50 text-[#0A2540] dark:text-white'
                        : 'text-[#0A2540] dark:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 flex items-center justify-center ${active || isThemeMenuOpen ? 'text-[#0A2540] dark:text-white' : 'text-[#6C757D] dark:text-gray-400'}`}>
                        {getThemeIcon()}
                      </div>
                      <span className="text-sm font-medium">Tema</span>
                    </div>
                    <ChevronRightIcon className={`w-4 h-4 text-[#6C757D] dark:text-gray-400 transition-transform duration-200 ${isThemeMenuOpen ? 'rotate-90' : ''}`} />
                  </button>

                  {/* Submenú de Tema */}
                  <AnimatePresence>
                    {isThemeMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-[#F8FAFC] dark:bg-[#0A0D12]/30 rounded-xl mt-1 border border-[#E9ECEF] dark:border-[#334155]"
                      >
                        {[
                          { value: 'light', label: 'Claro', icon: Sun },
                          { value: 'dark', label: 'Oscuro', icon: Moon },
                          { value: 'system', label: 'Sistema', icon: Monitor },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={(e) => {
                              e.preventDefault();
                              handleThemeChange(option.value as Theme);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-colors ${
                              theme === option.value
                                ? 'text-[#0A2540] bg-[#0A2540]/5 dark:text-[#00D4B3] dark:bg-[#00D4B3]/5'
                                : 'text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white'
                            }`}
                          >
                            <option.icon className="w-3.5 h-3.5" />
                            {option.label}
                            {theme === option.value && <Check className="w-3 h-3 ml-auto" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </Menu.Item>
          </div>

          {/* Footer - Cerrar Sesión */}
          <div className="p-2 border-t border-[#E9ECEF] dark:border-[#334155] mt-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleLogout}
                  className={`flex items-center w-full px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    active ? 'bg-red-50 dark:bg-red-900/10' : ''
                  }`}
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3 text-red-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    Cerrar Sesión
                  </span>
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
        </>
      )}
    </Menu>
  )
}
