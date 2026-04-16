'use client'

import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Route,
  BarChart3,
  FileText,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Network,
  ClipboardCheck
} from 'lucide-react'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'

interface BusinessPanelSidebarProps {
  isOpen: boolean
  onClose: () => void
  activeSection: string
  onSectionChange: (section: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  isPinned: boolean
  onTogglePin: () => void
  onHoverExpand?: () => void
}

export function BusinessPanelSidebar({
  isOpen,
  onClose,
  activeSection: _activeSection,
  onSectionChange,
  isCollapsed,
  onToggleCollapse,
  isPinned,
  onTogglePin,
  onHoverExpand
}: BusinessPanelSidebarProps) {
  const pathname = usePathname()
  const params = useParams()
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const { styles, effectiveStyles } = useOrganizationStylesContext()

  const sidebarRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [showPinFeedback, setShowPinFeedback] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const orgSlug = params?.orgSlug as string
  const panelStyles = effectiveStyles?.panel || styles?.panel
  const sidebarBackground = panelStyles?.sidebar_background || theme.panelBg
  const sidebarOpacity = panelStyles?.sidebar_opacity || 0.95
  const shouldExpand = isPinned || (isCollapsed && isHovered)
  const sidebarWidth = isCollapsed && !shouldExpand && !isMobile ? 80 : 280
  const xPosition = isMobile ? (isOpen ? 0 : '-100%') : 0

  const navigation = useMemo(() => [
    { name: t('sidebar.dashboard'), href: `/${orgSlug}/business-panel/dashboard`, icon: LayoutDashboard },
    { name: t('sidebar.users'), href: `/${orgSlug}/business-panel/users`, icon: Users },
    { name: t('sidebar.courses'), href: `/${orgSlug}/business-panel/courses`, icon: BookOpen },
    { name: t('sidebar.learningPaths', 'Rutas'), href: `/${orgSlug}/business-panel/learning-paths`, icon: Route },
    { name: t('sidebar.hierarchy', 'Estructura'), href: `/${orgSlug}/business-panel/hierarchy`, icon: Network },
    { name: t('sidebar.reports'), href: `/${orgSlug}/business-panel/reports`, icon: FileText },
    { name: t('sidebar.analytics'), href: `/${orgSlug}/business-panel/analytics`, icon: BarChart3 },
    { name: t('sidebar.reviews', 'Revisiones'), href: `/${orgSlug}/business-panel/reviews`, icon: ClipboardCheck },
    { name: t('sidebar.settings'), href: `/${orgSlug}/business-panel/settings`, icon: Settings }
  ], [orgSlug, t])

  const sidebarStyle = useMemo<CSSProperties>(() => {
    if (!sidebarBackground) {
      return { backgroundColor: theme.panelBg }
    }

    if (sidebarBackground.includes('linear-gradient') || sidebarBackground.includes('radial-gradient')) {
      return { background: sidebarBackground, backgroundColor: 'transparent' }
    }

    if (sidebarBackground.startsWith('#') && sidebarBackground.length >= 7) {
      const hex = sidebarBackground.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return { backgroundColor: `rgba(${r}, ${g}, ${b}, ${sidebarOpacity})` }
    }

    return { backgroundColor: sidebarBackground, opacity: sidebarOpacity }
  }, [sidebarBackground, sidebarOpacity, theme.panelBg])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        !isMobile &&
        isCollapsed &&
        isHovered &&
        !isPinned
      ) {
        setIsHovered(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isCollapsed, isHovered, isMobile, isPinned])

  useEffect(() => {
    if (!isCollapsed) {
      setIsHovered(false)
    }
  }, [isCollapsed])

  useEffect(() => {
    if (isHovered && isCollapsed && !isPinned && !isMobile && onHoverExpand) {
      onHoverExpand()
    }
  }, [isCollapsed, isHovered, isMobile, isPinned, onHoverExpand])

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 backdrop-blur-sm z-[100] lg:hidden"
            style={{ backgroundColor: theme.overlayBg }}
            onClick={onClose}
            aria-hidden="true"
          />
        ) : null}
      </AnimatePresence>

      <motion.div
        ref={sidebarRef}
        initial={false}
        animate={{ width: sidebarWidth, x: xPosition }}
        transition={{
          width: { duration: 0.3, ease: 'easeInOut' },
          x: { duration: 0.3, ease: [0.32, 0.72, 0, 1] }
        }}
        className="fixed inset-y-0 left-0 z-[110] h-full flex flex-col shadow-2xl overflow-hidden lg:translate-x-0 lg:relative lg:z-0 lg:shadow-none"
        style={{
          ...sidebarStyle,
          backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${theme.borderColor}`
        }}
        onHoverStart={() => {
          if (!isMobile && isCollapsed && !isPinned) setIsHovered(true)
        }}
        onHoverEnd={() => {
          if (!isMobile && isCollapsed && !isPinned) setIsHovered(false)
        }}
        onDoubleClick={(event) => {
          if (isMobile) return

          const target = event.target as HTMLElement
          if (target.tagName !== 'A' && target.tagName !== 'BUTTON' && !target.closest('a') && !target.closest('button')) {
            onTogglePin()
            setShowPinFeedback(true)
            setTimeout(() => setShowPinFeedback(false), 2000)
          }
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: `radial-gradient(circle at 100% 0%, ${theme.primaryColor}40 0%, transparent 20%), radial-gradient(circle at 0% 100%, ${theme.accentColor}40 0%, transparent 20%)`
          }}
        />

        <div className="relative flex-shrink-0 flex items-center justify-end px-4 pt-4 pb-2 lg:hidden">
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: theme.textColor, opacity: 0.6 }}
            onMouseEnter={(event) => {
              event.currentTarget.style.opacity = '1'
              event.currentTarget.style.backgroundColor = theme.hoverBg
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.opacity = '0.6'
              event.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence>
          {showPinFeedback ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-1 border-b overflow-hidden"
              style={{ backgroundColor: theme.hoverBg, borderColor: theme.borderColor }}
            >
              <p className="text-[10px] font-medium flex items-center gap-1.5 justify-center py-1" style={{ color: theme.accentColor }}>
                <MapPin className="w-3 h-3" />
                {isPinned ? t('sidebar.pinned') : t('sidebar.unpinned')}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <nav id="tour-sidebar-nav" className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 custom-scrollbar relative">
          <ul className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (isMobile) onClose()
                      const sectionName = item.href.split('/').pop() || ''
                      onSectionChange(sectionName)
                      if (!isMobile && isCollapsed && !isPinned && isHovered) {
                        setIsHovered(false)
                      }
                    }}
                    className={`group relative flex items-center px-3 py-3 rounded-xl transition-all duration-300 ease-out ${(isCollapsed && !shouldExpand && !isMobile) ? 'justify-center' : 'justify-start gap-3'}`}
                    style={{
                      backgroundColor: isActive ? theme.primaryColor : 'transparent',
                      color: isActive ? theme.onPrimaryColor : theme.textColor,
                      opacity: isActive ? 1 : 0.78,
                      boxShadow: isActive ? `0 4px 20px -5px ${theme.primaryColor}60` : 'none'
                    }}
                    onMouseEnter={(event) => {
                      if (!isActive) {
                        event.currentTarget.style.backgroundColor = theme.hoverBg
                        event.currentTarget.style.opacity = '1'
                      }
                    }}
                    onMouseLeave={(event) => {
                      if (!isActive) {
                        event.currentTarget.style.backgroundColor = 'transparent'
                        event.currentTarget.style.opacity = '0.78'
                      }
                    }}
                    title={(isCollapsed && !shouldExpand && !isMobile) ? item.name : undefined}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />

                    {!isCollapsed || shouldExpand || isMobile ? (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.name}
                      </motion.span>
                    ) : null}

                    {isCollapsed && !shouldExpand && !isMobile && isActive ? (
                      <div
                        className="absolute inset-0 rounded-xl blur-md -z-10 opacity-60"
                        style={{ background: theme.primaryColor }}
                      />
                    ) : null}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="mt-auto px-4 pb-4 pt-2">
          {!isMobile ? (
            <div className={`flex ${(!isCollapsed || shouldExpand) ? 'justify-end' : 'justify-center'} mb-4`}>
              <button
                onClick={onToggleCollapse}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{
                  color: theme.textColor,
                  opacity: 0.7,
                  border: `1px solid ${theme.borderColor}`,
                  backgroundColor: theme.inputBg
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.backgroundColor = theme.hoverBg
                  event.currentTarget.style.borderColor = theme.dividerColor
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.backgroundColor = theme.inputBg
                  event.currentTarget.style.borderColor = theme.borderColor
                }}
                title={isCollapsed ? t('sidebar.pinMenu') : t('sidebar.collapseMenu')}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          ) : null}
        </div>
      </motion.div>
    </>
  )
}
