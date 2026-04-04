'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  BookOpenIcon,
  CpuChipIcon,
  NewspaperIcon,
  PlayIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  XMarkIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  Bars3Icon,
  MapPinIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { MapPinIcon as MapPinIconSolid } from '@heroicons/react/24/solid'
import { useTranslation } from 'react-i18next'

interface InstructorSidebarProps {
  isOpen: boolean
  onClose: () => void
  activeSection: string
  onSectionChange: (section: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  isPinned: boolean
  onTogglePin: () => void
}

const getNavigation = (t: (key: string) => string) => [
  { name: t('sidebar.nav.dashboard'), href: '/instructor/dashboard', icon: HomeIcon },
  { name: t('sidebar.nav.workshops'), href: '/instructor/workshops', icon: BookOpenIcon },
  { name: t('sidebar.nav.communities'), href: '/instructor/communities', icon: UserGroupIcon },
  { name: t('sidebar.nav.aiApps'), href: '/instructor/apps', icon: CpuChipIcon },
  { name: t('sidebar.nav.skills'), href: '/instructor/skills', icon: AcademicCapIcon },
  { name: t('sidebar.nav.news'), href: '/instructor/news', icon: NewspaperIcon },
  { name: t('sidebar.nav.reels'), href: '/instructor/reels', icon: PlayIcon },
  { name: t('sidebar.nav.stats'), href: '/instructor/stats', icon: ChartBarIcon },
  { name: t('sidebar.nav.companies'), href: '/instructor/companies', icon: BuildingOffice2Icon },
  { name: t('sidebar.nav.reports'), href: '/instructor/reportes', icon: DocumentTextIcon },
]

export function InstructorSidebar({
  isOpen,
  onClose,
  activeSection,
  onSectionChange,
  isCollapsed,
  onToggleCollapse,
  isPinned,
  onTogglePin,
}: InstructorSidebarProps) {
  const { t } = useTranslation('instructor')
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [lastClickTime, setLastClickTime] = useState(0)
  const [showPinFeedback, setShowPinFeedback] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const shouldExpand = isPinned || (isCollapsed && isHovered)
  const actualWidth = shouldExpand ? 'w-64' : isCollapsed ? 'w-16' : 'w-64'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        if (isPinned) return
        if (isCollapsed && isHovered) setIsHovered(false)
        if (!isCollapsed) onToggleCollapse()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isCollapsed, isHovered, isPinned, onToggleCollapse])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isCollapsed && isHovered && !isPinned) setIsHovered(false)
        if (isOpen) onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isCollapsed, isHovered, isPinned, isOpen, onClose])

  useEffect(() => {
    if (!isCollapsed) setIsHovered(false)
  }, [isCollapsed])

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-gray-900/70 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`
          fixed inset-y-0 left-0 z-40 bg-gradient-to-b from-indigo-950 via-purple-950 to-indigo-950 border-r border-purple-800/40 shadow-xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:flex lg:flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${actualWidth}
        `}
        onMouseEnter={() => {
          if (isCollapsed && !isPinned) setIsHovered(true)
        }}
        onMouseLeave={() => {
          if (isCollapsed && !isPinned) setIsHovered(false)
        }}
        onDoubleClick={(event) => {
          // Solo activar doble click si no se hace click en un enlace o botón
          const target = event.target as HTMLElement
          if (target.tagName !== 'A' && target.tagName !== 'BUTTON' && !target.closest('a') && !target.closest('button')) {
            onTogglePin()
            setShowPinFeedback(true)
            setTimeout(() => setShowPinFeedback(false), 2000)
          }
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-purple-800/40 flex-shrink-0">
          <div className="flex items-center">
            <img src="/icono.png" alt="SofLIA" className="h-8 w-8 rounded-lg flex-shrink-0" />
          </div>
          <div className="flex items-center space-x-2">
            {/* Botón de fijar - siempre visible en desktop */}
            <button
              onClick={(event) => {
                event.stopPropagation()
                onTogglePin()
              }}
              className="hidden lg:block p-2 rounded-md text-purple-300 hover:text-white hover:bg-purple-800/50 transition-colors"
              title={isPinned ? t('sidebar.pin.unpinPanel') : t('sidebar.pin.pinPanel')}
            >
              {isPinned ? (
                <MapPinIconSolid className="h-4 w-4 text-purple-400" />
              ) : (
                <MapPinIcon className="h-4 w-4" />
              )}
            </button>
            
            {/* Botón de cerrar en mobile */}
            <button
              onClick={(event) => {
                event.stopPropagation()
                onClose()
              }}
              className="lg:hidden p-2 rounded-md text-purple-300 hover:text-white hover:bg-purple-800/50 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Hint for pin while hovered */}
        {isCollapsed && isHovered && !isPinned && (
          <div className="px-4 py-1.5 bg-gradient-to-r from-purple-600/10 to-transparent border-b border-purple-800/30">
            <p className="text-xs text-purple-300/80 font-light flex items-center gap-1.5">
              <MapPinIcon className="h-3 w-3 text-purple-400/60" />
              {t('sidebar.pin.doubleClickToPin')}
            </p>
          </div>
        )}
        
        {/* Indicador de panel fijado */}
        {isPinned && !isCollapsed && (
          <div className="px-4 py-1.5 bg-gradient-to-r from-purple-600/15 to-transparent border-b border-purple-800/30">
            <p className="text-xs text-purple-200/90 font-light flex items-center gap-1.5">
              <MapPinIconSolid className="h-3 w-3 text-purple-400" />
              {t('sidebar.pin.panelPinned')}
            </p>
          </div>
        )}
        
        {/* Feedback temporal de doble click */}
        {showPinFeedback && (
          <div className="px-4 py-1.5 bg-gradient-to-r from-purple-500/20 to-transparent border-b border-purple-700/40">
            <p className="text-xs text-purple-200 font-light flex items-center gap-1.5 animate-in fade-in duration-200">
              <MapPinIconSolid className="h-3 w-3 text-purple-400" />
              {isPinned ? t('sidebar.pin.panelPinned') : t('sidebar.pin.panelUnpinned')}
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-6 overflow-y-auto">
          <div className="space-y-1">
            {getNavigation(t).map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(event) => {
                    event.stopPropagation()
                    onSectionChange(item.name.toLowerCase())
                    onClose()
                    if (isCollapsed && isHovered && !isPinned) setIsHovered(false)
                  }}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105
                    ${isActive ? 'bg-purple-600 text-white shadow-md' : 'text-purple-200 hover:bg-purple-800/50 hover:text-white'}
                    ${isCollapsed && !shouldExpand ? 'justify-center' : ''}
                  `}
                  title={isCollapsed && !shouldExpand ? item.name : undefined}
                >
                  <item.icon
                    className={`
                      h-5 w-5 transition-colors duration-200 flex-shrink-0
                      ${isActive ? 'text-white' : 'text-purple-300 group-hover:text-white'}
                      ${isCollapsed && !shouldExpand ? '' : 'mr-3'}
                    `}
                  />
                  {(!isCollapsed || shouldExpand) && <span className="flex-1 truncate">{item.name}</span>}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User info (placeholder) */}
        <div className="flex-shrink-0 p-4 border-t border-purple-800/40">
          <div className={`flex items-center ${isCollapsed && !shouldExpand ? 'justify-center' : ''}`}>
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">I</span>
              </div>
            </div>
            {(!isCollapsed || shouldExpand) && (
              <div className="ml-3 min-w-0">
                <p className="text-sm font-medium text-purple-100 truncate">{t('sidebar.user.role')}</p>
                <p className="text-xs text-purple-300 truncate">{t('sidebar.user.panel')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default InstructorSidebar


