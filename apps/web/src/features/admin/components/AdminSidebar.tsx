'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  FileText,
  X,
  ChevronRight,
  MapPin,
  Building2,
  ClipboardCheck,
  ChevronLeft
} from 'lucide-react'
import Image from 'next/image'
import { useOrganizationStylesContext } from '../../business-panel/contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { useTranslation } from 'react-i18next'

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
  activeSection: string
  onSectionChange: (section: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Usuarios', href: '/admin/users', icon: Users },
  { name: 'Talleres', href: '/admin/workshops', icon: BookOpen },
  { name: 'SofLIA Analytics', href: '/admin/lia-analytics', icon: BarChart3 },
  { name: 'Estadísticas de Usuarios', href: '/admin/user-stats', icon: MapPin },
  { name: 'Empresas', href: '/admin/companies', icon: Building2 },
  { name: 'Reportes', href: '/admin/reportes', icon: FileText },
  { name: 'Revisiones', href: '/admin/courses/pending', icon: ClipboardCheck },
]

export function AdminSidebar({ isOpen, onClose, activeSection, onSectionChange, isCollapsed, onToggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Obtener tema del usuario (light/dark)
  const { resolvedTheme } = useThemeStore()
  const isLightTheme = resolvedTheme === 'light'

  // Obtener estilos de la organización para el tema
  const { styles: orgStyles } = useOrganizationStylesContext()
  const panelStyles = orgStyles?.panel

  // Colores del tema
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const accentColor = panelStyles?.accent_color || '#00D4B3'
  const textColor = isLightTheme ? '#0A2540' : '#FFFFFF'
  const borderColor = isLightTheme ? '#E2E8F0' : 'rgba(255,255,255,0.1)'
  const hoverBg = isLightTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)'
  const sidebarBackground = isLightTheme ? '#FFFFFF' : '#0a0a0a'

  // Calcular estilos dinámicos para el fondo (Glassmorphism)
  const sidebarStyle: React.CSSProperties = useMemo(() => {
    const opacity = 0.95
    if (isLightTheme) {
      return { backgroundColor: `rgba(255, 255, 255, ${opacity})` }
    }
    return { backgroundColor: `rgba(10, 10, 10, ${opacity})` }
  }, [isLightTheme])

  // Lógica para determinar si el sidebar debe estar expandido
  const shouldExpand = !isCollapsed
  const actualWidth = isCollapsed ? 'w-16' : 'w-64'

  // Detectar clics fuera del sidebar para cerrarlo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        if (!isCollapsed) {
          onToggleCollapse()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCollapsed, onToggleCollapse])

  // Detectar tecla Escape para cerrar el sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isOpen) {
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])


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
        className={`fixed inset-y-0 left-0 z-[50] shadow-xl lg:flex lg:flex-col overflow-hidden transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        transition={{
          width: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
        }}
        style={{
          ...sidebarStyle,
          backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${borderColor}`,
          willChange: 'width'
        }}
      >
        <div
          className="w-full h-full flex flex-col relative"
          style={{
            width: '100%',
            minWidth: isCollapsed ? '64px' : '256px'
          }}
        >
          {/* Decoracion de fondo sutil */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: `radial-gradient(circle at 100% 0%, ${primaryColor}40 0%, transparent 20%), 
                           radial-gradient(circle at 0% 100%, ${accentColor}40 0%, transparent 20%)`
            }}
          />
          {/* Header */}
          <div
            className="flex items-center justify-between h-20 border-b flex-shrink-0 overflow-hidden relative z-10"
            style={{
              borderColor,
              paddingLeft: (!isCollapsed || shouldExpand) ? '1.5rem' : '0',
              paddingRight: (!isCollapsed || shouldExpand) ? '1.5rem' : '0',
            }}
          >
            <AnimatePresence mode="wait">
              {(!isCollapsed || shouldExpand) ? (
                <motion.div
                  key="logo-expanded"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 min-w-0"
                >
                  <div className="h-10 w-10 p-2 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 relative overflow-hidden shadow-lg border border-white/10">
                    <Image
                      src="/Logo.png"
                      alt="SOFLIA Logo"
                      width={28}
                      height={28}
                      className="object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold tracking-tight" style={{ color: textColor }}>SOFLIA</p>
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-50" style={{ color: textColor }}>SuperAdmin</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="logo-collapsed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-center w-full"
                >
                  <div className="h-10 w-10 p-2 rounded-xl bg-white/5 flex items-center justify-center relative overflow-hidden shadow-lg border border-white/10">
                    <Image
                      src="/Logo.png"
                      alt="SOFLIA Logo"
                      width={28}
                      height={28}
                      className="object-contain"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Close Button */}
            <motion.button
              onClick={(event) => {
                event.stopPropagation()
                onClose()
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="lg:hidden p-2 rounded-lg transition-colors"
              style={{ color: textColor, opacity: 0.7 }}
            >
              <X className="h-5 w-5" />
            </motion.button>
          </div>


          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 overflow-y-auto overflow-x-hidden relative z-10 custom-scrollbar">
            <ul className="space-y-1.5">
              {navigation.map((item, index) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
                const Icon = item.icon
                return (
                  <motion.li
                    key={item.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={(event) => {
                        event.stopPropagation()
                        onSectionChange(item.name.toLowerCase())
                        onClose()
                      }}
                      className={`
                        group relative flex items-center px-3 py-3 rounded-xl
                        transition-all duration-300 ease-out
                        ${isActive ? 'shadow-lg' : 'hover:bg-white/5'}
                        ${(isCollapsed && !shouldExpand) ? 'justify-center' : 'justify-start gap-3'}
                      `}
                      style={{
                        backgroundColor: isActive ? primaryColor : 'transparent',
                        color: isActive ? '#FFFFFF' : textColor,
                        boxShadow: isActive ? `0 4px 20px -5px ${primaryColor}60` : 'none',
                        opacity: isActive ? 1 : 0.7
                      } as any}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = hoverBg;
                          e.currentTarget.style.opacity = '1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.opacity = '0.7';
                        }
                      }}
                      title={(isCollapsed && !shouldExpand) ? item.name : undefined}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                      
                      {(!isCollapsed || shouldExpand) && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="text-sm font-medium whitespace-nowrap overflow-hidden flex-1"
                        >
                          {item.name}
                        </motion.span>
                      )}

                      {isActive && (!isCollapsed || shouldExpand) && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                        >
                          <ChevronRight className="w-4 h-4 opacity-50" />
                        </motion.div>
                      )}

                      {/* Active Indicator Glow for Collapsed */}
                      {isCollapsed && !shouldExpand && isActive && (
                        <div
                          className="absolute inset-0 rounded-xl blur-md -z-10 opacity-60"
                          style={{ background: primaryColor }}
                        />
                      )}
                    </Link>
                  </motion.li>
                )
              })}
            </ul>
          </nav>

          {/* Footer Section */}
          <div className="mt-auto px-4 pb-6 pt-2 relative z-10">
            {/* Collapse Toggle Button - Desktop Only */}
            <div className={`flex ${(!isCollapsed || shouldExpand) ? 'justify-end' : 'justify-center'}`}>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 border"
                style={{
                  color: textColor,
                  opacity: 0.6,
                  borderColor,
                  backgroundColor: 'rgba(255,255,255,0.05)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hoverBg; e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.opacity = '0.6'; }}
              >
                {isCollapsed && !shouldExpand ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
