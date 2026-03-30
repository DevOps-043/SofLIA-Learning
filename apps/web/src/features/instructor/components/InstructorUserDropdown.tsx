'use client'

import { useState, useRef, useEffect } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { 
  UserIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  HomeIcon,
  ShieldCheckIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../auth/hooks/useAuth'
import { useThemeStore, Theme } from '@/core/stores/themeStore'

interface InstructorUserDropdownProps {
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
    profile_picture_url?: string
    cargo_rol: string
  }
}

export function InstructorUserDropdown({ user }: InstructorUserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const router = useRouter()
  const { logout } = useAuth()
  const { theme, setTheme, initializeTheme } = useThemeStore()

  useEffect(() => {
    initializeTheme()
    setHydrated(true)
  }, [initializeTheme])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth')
    } catch (error) {
    }
  }


  const handleDashboard = () => {
    router.push('/dashboard')
    setIsOpen(false)
  }
  const handleAdminPanel = () => {
    router.push('/admin/dashboard')
    setIsOpen(false)
  }
  const handleInstructorPanel = () => {
    router.push('/instructor/dashboard')
    setIsOpen(false)
  }

  const handleSettings = () => {
    router.push('/instructor/settings')
    setIsOpen(false)
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

  return (
    <Menu as="div" className="relative z-50">
      <Menu.Button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-purple-700/50 transition-all duration-200 hover:scale-105"
      >
        {/* Avatar */}
        <div className="relative">
          {user.profile_picture_url ? (
            <img
              src={user.profile_picture_url}
              alt={getDisplayName()}
              className="w-8 h-8 rounded-full object-cover border-2 border-yellow-400/50 shadow-lg"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-lg ring-2 ring-purple-500/50">
              {getInitials()}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-white">
            {getDisplayName()}
          </p>
          <p className="text-xs text-purple-200">
            {user.cargo_rol}
          </p>
        </div>

        {/* Chevron */}
        <ChevronDownIcon 
          className={`w-4 h-4 text-purple-200 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </Menu.Button>

      <Transition
        show={isOpen}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-72 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg shadow-xl border border-purple-700/50 py-2 z-50 backdrop-blur-sm">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-purple-700/50">
            <div className="flex items-center space-x-3">
              {user.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt={getDisplayName()}
                  className="w-10 h-10 rounded-full object-cover border-2 border-yellow-400/50 shadow-lg"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold shadow-lg ring-2 ring-purple-500/50">
                  {getInitials()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-purple-200 truncate" title={user.email}>
                  {user.email}
                </p>
                <p className="text-xs text-yellow-400 font-bold flex items-center">
                  <AcademicCapIcon className="h-3 w-3 mr-1" />
                  {user.cargo_rol}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleDashboard}
                  className={`${active ? 'bg-purple-700/50' : ''} flex items-center w-full px-4 py-2 text-sm text-purple-200 hover:text-white transition-all duration-200 hover:scale-105`}
                >
                  <HomeIcon className="w-4 h-4 mr-3" />
                  Ir al Home
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleAdminPanel}
                  className={`${active ? 'bg-red-600/20' : ''} flex items-center w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-all duration-200 hover:scale-105`}
                >
                  <ShieldCheckIcon className="w-4 h-4 mr-3" />
                  Panel de Administración
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleInstructorPanel}
                  className={`${active ? 'bg-yellow-600/20' : ''} flex items-center w-full px-4 py-2 text-sm text-yellow-400 hover:text-yellow-300 transition-all duration-200 hover:scale-105`}
                >
                  <AcademicCapIcon className="w-4 h-4 mr-3" />
                  Panel de Instructor
                </button>
              )}
            </Menu.Item>
            {/* Configuración eliminada por solicitud */}
            <div className="border-t border-purple-700/50 my-2"></div>
            {/* Opciones de Tema */}
            {hydrated && theme && (
              <div className="px-2 py-1">
                <div className="px-2 py-1.5 text-xs font-semibold text-purple-300 uppercase tracking-wider">
                  Tema
                </div>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        setTheme('light')
                        setIsOpen(false)
                      }}
                      className={`${active ? 'bg-purple-700/50' : ''} flex items-center justify-between w-full px-4 py-2 text-sm text-purple-200 hover:text-white transition-all duration-200 rounded-lg`}
                    >
                      <div className="flex items-center">
                        <Sun className="w-4 h-4 mr-3 text-yellow-400" />
                        Modo Claro
                      </div>
                      {theme === 'light' && (
                        <Check className="w-4 h-4 text-blue-400" />
                      )}
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        setTheme('dark')
                        setIsOpen(false)
                      }}
                      className={`${active ? 'bg-purple-700/50' : ''} flex items-center justify-between w-full px-4 py-2 text-sm text-purple-200 hover:text-white transition-all duration-200 rounded-lg`}
                    >
                      <div className="flex items-center">
                        <Moon className="w-4 h-4 mr-3 text-purple-400" />
                        Modo Oscuro
                      </div>
                      {theme === 'dark' && (
                        <Check className="w-4 h-4 text-blue-400" />
                      )}
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        setTheme('system')
                        setIsOpen(false)
                      }}
                      className={`${active ? 'bg-purple-700/50' : ''} flex items-center justify-between w-full px-4 py-2 text-sm text-purple-200 hover:text-white transition-all duration-200 rounded-lg`}
                    >
                      <div className="flex items-center">
                        <Monitor className="w-4 h-4 mr-3 text-blue-400" />
                        Seguir Sistema
                      </div>
                      {theme === 'system' && (
                        <Check className="w-4 h-4 text-blue-400" />
                      )}
                    </button>
                  )}
                </Menu.Item>
              </div>
            )}
            <div className="border-t border-purple-700/50 my-2"></div>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleLogout}
                  className={`${active ? 'bg-red-600/20' : ''} flex items-center w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-all duration-200 hover:scale-105`}
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                  Cerrar Sesión
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

