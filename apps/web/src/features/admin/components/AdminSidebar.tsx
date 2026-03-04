'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HomeIcon,
  UsersIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ChartBarIcon,
  XMarkIcon,
  ChevronRightIcon,
  MapPinIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline'
import { MapPinIcon as MapPinIconSolid } from '@heroicons/react/24/solid'
import Image from 'next/image'
import { useOrganizationStylesContext } from '../../business-panel/contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
  activeSection: string
  onSectionChange: (section: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  isPinned: boolean
  onTogglePin: () => void
  onHoverChange?: (isHovered: boolean) => void
}

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { name: 'Usuarios', href: '/admin/users', icon: UsersIcon },
  { name: 'Talleres', href: '/admin/workshops', icon: BookOpenIcon },
  { name: 'SofLIA Analytics', href: '/admin/lia-analytics', icon: ChartBarIcon },
  { name: 'Estadísticas de Usuarios', href: '/admin/user-stats', icon: MapPinIcon },
  { name: 'Empresas', href: '/admin/companies', icon: BuildingOffice2Icon },
  { name: 'Reportes', href: '/admin/reportes', icon: DocumentTextIcon },
  { name: 'Revisiones', href: '/admin/courses/pending', icon: DocumentTextIcon }, // TODO: Cambiar icono por ClipboardDocumentCheckIcon si está disponible
  // TODO: [PENDING] Implementar sección de Gestión de Skills e Insignias (ver migración 20260204120000_create_skills_tables.sql)
  // { name: 'Skills & Badges', href: '/admin/skills', icon: AcademicCapIcon },
]

export function AdminSidebar({ isOpen, onClose, activeSection, onSectionChange, isCollapsed, onToggleCollapse, isPinned, onTogglePin, onHoverChange }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [showPinFeedback, setShowPinFeedback] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Obtener tema del usuario (light/dark)
  const { resolvedTheme } = useThemeStore()
  const isLightTheme = resolvedTheme === 'light'

  // Obtener estilos de la organización para el tema
  const { styles: orgStyles } = useOrganizationStylesContext()
  const panelStyles = orgStyles?.panel

  // Colores del tema
  const themeColors = {
    background: isLightTheme ? '#FFFFFF' : '#0F1419',
    borderColor: isLightTheme ? '#E2E8F0' : '#334155',
    textPrimary: isLightTheme ? '#0A2540' : '#FFFFFF',
    textSecondary: isLightTheme ? '#6C757D' : '#9CA3AF',
    hoverBg: isLightTheme ? '#F1F5F9' : '#1E2329',
    activeBg: isLightTheme ? '#0A2540' : '#0A2540',
    activeText: '#FFFFFF',
    accent: panelStyles?.accent_color || '#00D4B3',
  }

  // Lógica para determinar si el sidebar debe estar expandido
  const shouldExpand = isPinned || (isCollapsed && isHovered)
  const actualWidth = shouldExpand ? 'w-64' : (isCollapsed ? 'w-16' : 'w-64')

  // Detectar clics fuera del sidebar para cerrarlo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        if (isPinned) {
          return
        }

        if (isCollapsed && isHovered) {
          setIsHovered(false)
        }

        if (!isCollapsed) {
          onToggleCollapse()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCollapsed, isHovered, isPinned, onToggleCollapse])

  // Detectar tecla Escape para cerrar el sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isCollapsed && isHovered && !isPinned) {
          setIsHovered(false)
        }
        if (isOpen) {
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isCollapsed, isHovered, isPinned, isOpen, onClose])

  // Limpiar estado de hover cuando cambia el estado de colapso
  useEffect(() => {
    if (!isCollapsed) {
      setIsHovered(false)
    }
  }, [isCollapsed])

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        ref={sidebarRef}
        initial={false}
        animate={{
          width: isCollapsed && !shouldExpand ? 64 : 256,
        }}
        transition={{
          width: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
        }}
        className={`fixed inset-y-0 left-0 z-50 shadow-xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:flex lg:flex-col border-r overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        onAnimationStart={() => {
          // Asegurar que el color de fondo esté presente desde el inicio
          if (sidebarRef.current) {
            sidebarRef.current.style.backgroundColor = themeColors.background
          }
        }}
        style={{
          backgroundColor: themeColors.background,
          borderColor: themeColors.borderColor,
          willChange: 'width'
        }}
        onMouseEnter={() => {
          if (isCollapsed && !isPinned) {
            setIsHovered(true)
            onHoverChange?.(true)
          }
        }}
        onMouseLeave={() => {
          if (isCollapsed && !isPinned) {
            setIsHovered(false)
            onHoverChange?.(false)
          }
        }}
        onDoubleClick={(event) => {
          const target = event.target as HTMLElement
          if (target.tagName !== 'A' && target.tagName !== 'BUTTON' && !target.closest('a') && !target.closest('button')) {
            onTogglePin()
            setShowPinFeedback(true)
            setTimeout(() => setShowPinFeedback(false), 2000)
          }
        }}
        onClick={(event) => {
          if (isCollapsed && isHovered && !isPinned && !isClicking) {
            setIsClicking(true)
            event.preventDefault()
            event.stopPropagation()
            onTogglePin()
            setTimeout(() => setIsClicking(false), 300)
          }
        }}
      >
        {/* Wrapper interno para garantizar color de fondo durante animación */}
        <div
          className="w-full h-full flex flex-col"
          style={{
            backgroundColor: themeColors.background,
            width: '100%',
            minWidth: '256px'
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between h-16 border-b flex-shrink-0 overflow-hidden"
            style={{
              backgroundColor: themeColors.background,
              borderColor: themeColors.borderColor,
              paddingLeft: (!isCollapsed || shouldExpand) ? '1rem' : '0',
              paddingRight: (!isCollapsed || shouldExpand) ? '1rem' : '0',
            }}
          >
            <AnimatePresence mode="wait">
              {(!isCollapsed || shouldExpand) ? (
                <motion.div
                  key="logo-expanded"
                  initial={{ opacity: 0, x: -10, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: 'auto' }}
                  exit={{ opacity: 0, x: -10, width: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                    <Image
                      src="/Logo.png"
                      alt="SOFLIA Logo"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: themeColors.textPrimary }}>SOFLIA</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="logo-collapsed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="flex items-center justify-center w-full flex-shrink-0"
                >
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center relative overflow-hidden">
                    <Image
                      src="/Logo.png"
                      alt="SOFLIA Logo"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="flex items-center gap-1 flex-shrink-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: (!isCollapsed || shouldExpand) ? 1 : 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Botón de fijar */}
              <motion.button
                onClick={(event) => {
                  event.stopPropagation()
                  onTogglePin()
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="hidden lg:block p-1.5 rounded-md transition-colors"
                style={{ color: themeColors.textSecondary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = themeColors.hoverBg;
                  e.currentTarget.style.color = themeColors.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = themeColors.textSecondary;
                }}
                title={isPinned ? 'Desfijar panel' : 'Fijar panel'}
              >
                {isPinned ? (
                  <MapPinIconSolid className="h-4 w-4" style={{ color: themeColors.accent }} />
                ) : (
                  <MapPinIcon className="h-4 w-4" />
                )}
              </motion.button>

              {/* Botón de cerrar en mobile */}
              <motion.button
                onClick={(event) => {
                  event.stopPropagation()
                  onClose()
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="lg:hidden p-1.5 rounded-md transition-colors"
                style={{ color: themeColors.textSecondary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = themeColors.hoverBg;
                  e.currentTarget.style.color = themeColors.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = themeColors.textSecondary;
                }}
              >
                <XMarkIcon className="h-5 w-5" />
              </motion.button>
            </motion.div>
          </div>

          {/* Indicadores de estado */}
          <AnimatePresence>
            {isCollapsed && isHovered && !isPinned && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 py-1.5 bg-gradient-to-r to-transparent border-b"
                style={{
                  backgroundColor: themeColors.background,
                  backgroundImage: `linear-gradient(to right, ${themeColors.accent}15, ${themeColors.background})`,
                  borderColor: `${themeColors.accent}30`
                }}
              >
                <p className="text-xs font-light flex items-center gap-1.5" style={{ color: themeColors.accent }}>
                  <MapPinIcon className="h-3 w-3" />
                  Doble clic para fijar
                </p>
              </motion.div>
            )}

            {isPinned && !isCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 py-1.5 bg-gradient-to-r to-transparent border-b"
                style={{
                  backgroundColor: themeColors.background,
                  backgroundImage: `linear-gradient(to right, ${themeColors.accent}15, ${themeColors.background})`,
                  borderColor: `${themeColors.accent}30`
                }}
              >
                <p className="text-xs font-light flex items-center gap-1.5" style={{ color: themeColors.accent }}>
                  <MapPinIconSolid className="h-3 w-3" />
                  Panel fijado
                </p>
              </motion.div>
            )}

            {showPinFeedback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 py-1.5 bg-gradient-to-r from-[#10B981]/10 to-transparent border-b border-[#10B981]/20"
                style={{ backgroundColor: themeColors.background }}
              >
                <p className="text-xs text-[#10B981] font-light flex items-center gap-1.5">
                  <MapPinIconSolid className="h-3 w-3" />
                  {isPinned ? 'Panel fijado' : 'Panel desfijado'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto" style={{ backgroundColor: themeColors.background }}>
            <div className="space-y-1">
              {navigation.map((item, index) => {
                const isActive = pathname === item.href
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                  >
                    <Link
                      href={item.href}
                      onClick={(event) => {
                        event.stopPropagation()
                        onSectionChange(item.name.toLowerCase())
                        onClose()
                        if (isCollapsed && isHovered && !isPinned) {
                          setIsHovered(false)
                        }
                      }}
                      className={`
                      group relative flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                      ${(isCollapsed && !shouldExpand) ? 'justify-center' : ''}
                    `}
                      style={{
                        backgroundColor: isActive ? themeColors.activeBg : 'transparent',
                        color: isActive ? themeColors.activeText : themeColors.textSecondary,
                        boxShadow: isActive ? `0 4px 6px -1px ${themeColors.activeBg}30` : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = themeColors.hoverBg;
                          e.currentTarget.style.color = themeColors.textPrimary;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = themeColors.textSecondary;
                        }
                      }}
                      title={(isCollapsed && !shouldExpand) ? item.name : undefined}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                          style={{ backgroundColor: themeColors.accent }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      <item.icon
                        className={`h-5 w-5 transition-colors duration-200 flex-shrink-0 ${(isCollapsed && !shouldExpand) ? '' : 'mr-3'}`}
                        style={{ color: isActive ? themeColors.activeText : 'inherit' }}
                      />
                      <AnimatePresence>
                        {(!isCollapsed || shouldExpand) && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 truncate"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {isActive && (!isCollapsed || shouldExpand) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                          <ChevronRightIcon className="h-4 w-4 flex-shrink-0" style={{ color: themeColors.activeText }} />
                        </motion.div>
                      )}
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </nav>
        </div>
      </motion.div>
    </>
  )
}
