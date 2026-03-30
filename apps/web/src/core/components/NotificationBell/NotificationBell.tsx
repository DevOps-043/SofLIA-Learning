'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Check, CheckCheck, Archive, Trash2, AlertCircle, Info, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getNotificationIcon, getNotificationBorderColor, getNotificationBgColor, getNotificationTextColor } from '@/features/notifications/utils/notification-categories'

/**
 * Props del componente NotificationBell
 */
export interface NotificationBellProps {
  /**
   * Clase CSS adicional para el botón
   */
  className?: string
  
  /**
   * Tamaño del icono (default: 'md')
   */
  iconSize?: 'sm' | 'md' | 'lg'
  
  /**
   * Mostrar animación de pulso cuando hay notificaciones críticas
   */
  showPulse?: boolean
  
  /**
   * Variante del diseño ('default' | 'compact')
   */
  variant?: 'default' | 'compact'
}

/**
 * Componente NotificationBell
 * 
 * Muestra un botón de campana con badge de contador de no leídas
 * y un dropdown con las últimas notificaciones
 * 
 * Usa el contexto global de notificaciones
 */
export function NotificationBell({
  className = '',
  iconSize = 'md',
  showPulse = true,
  variant = 'default'
}: NotificationBellProps) {
  const {
    notifications,
    unreadCount,
    criticalCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    isDropdownOpen,
    setIsDropdownOpen
  } = useNotifications()

  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0, maxHeight: 0 })

  // Detectar si estamos en móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // sm breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Calcular posición del dropdown en móvil
  useEffect(() => {
    const updateDropdownPosition = () => {
      if (isMobile && buttonRef.current && isDropdownOpen) {
        const rect = buttonRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const dropdownMinHeight = 200 // Altura mínima del dropdown
        const spaceBelow = viewportHeight - rect.bottom - 16
        const spaceAbove = rect.top - 16
        
        // Si hay más espacio arriba que abajo, mostrar arriba
        let top: number
        let maxHeight: number
        
        if (spaceAbove > spaceBelow && spaceBelow < dropdownMinHeight) {
          // Mostrar arriba del botón
          const estimatedHeight = Math.min(viewportHeight - 96, 400)
          top = Math.max(16, rect.top - estimatedHeight - 8)
          maxHeight = Math.min(estimatedHeight, rect.top - 16)
        } else {
          // Mostrar abajo del botón (comportamiento normal)
          top = rect.bottom + 8
          maxHeight = Math.min(spaceBelow, viewportHeight - 96)
        }
        
        setDropdownPosition({
          top: top,
          right: window.innerWidth - rect.right,
          maxHeight: Math.max(maxHeight, 200) // Altura mínima
        })
      }
    }

    if (isMobile && isDropdownOpen) {
      updateDropdownPosition()
      window.addEventListener('scroll', updateDropdownPosition)
      window.addEventListener('resize', updateDropdownPosition)
    }

    return () => {
      window.removeEventListener('scroll', updateDropdownPosition)
      window.removeEventListener('resize', updateDropdownPosition)
    }
  }, [isMobile, isDropdownOpen])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen, setIsDropdownOpen])

  // Tamaños de icono
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  // Obtener icono según tipo de notificación
  const getNotificationIconByType = (notificationType: string) => {
    const Icon = getNotificationIcon(notificationType)
    const iconClass = "w-5 h-5"
    const textColor = getNotificationTextColor(notificationType).replace('text-', '')
    return <Icon className={`${iconClass} ${textColor}`} />
  }

  // Obtener color según tipo de notificación
  const getNotificationColor = (notificationType: string) => {
    return getNotificationBorderColor(notificationType)
  }

  // Obtener color de fondo según prioridad
  const getPriorityBg = (priority: string, isUnread: boolean) => {
    const baseColors = {
      critical: 'hover:bg-red-500/10',
      high: 'hover:bg-[#F59E0B]/10',
      medium: 'hover:bg-[#00D4B3]/10',
      low: 'hover:bg-[#0A2540]/10',
      default: 'hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/20'
    }
    
    const unreadBg = isUnread 
      ? 'bg-[#E9ECEF]/30 dark:bg-[#0A2540]/10' 
      : 'bg-white dark:bg-[#1E2329]'
    return `${unreadBg} ${baseColors[priority as keyof typeof baseColors] || baseColors.default}`
  }

  // Manejar click en notificación
  const handleNotificationClick = async (notification: any) => {
    // Marcar como leída si no está leída
    if (notification.status === 'unread') {
      try {
        await markAsRead(notification.notification_id)
      } catch (error) {
      }
    }

    // Navegar a la URL de acción si existe
    if (notification.metadata?.action_url) {
      router.push(notification.metadata.action_url)
      setIsDropdownOpen(false)
    }
  }

  // Manejar marcar como leída
  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    try {
      await markAsRead(notificationId)
    } catch (error) {
    }
  }

  // Manejar archivar
  const handleArchive = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    try {
      await archiveNotification(notificationId)
    } catch (error) {
    }
  }

  // Manejar eliminar
  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    // Confirmar antes de eliminar
    if (window.confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
      try {
        await deleteNotification(notificationId)
      } catch (error) {
      }
    }
  }

  // Manejar marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botón de Campana */}
      <motion.button
        ref={buttonRef}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative p-2.5 text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-[#00D4B3] transition-colors rounded-lg hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Notificaciones"
      >
        <Bell className={`${iconSizes[iconSize]}`} />
        
        {/* Badge de contador */}
        {unreadCount > 0 && (
          <motion.span
            className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 bg-[#0A2540] dark:bg-[#00D4B3] rounded-full text-xs flex items-center justify-center text-white font-semibold z-10 shadow-sm"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}

        {/* Animación de pulso para notificaciones críticas */}
        {showPulse && criticalCount > 0 && (
          <motion.div
            className="absolute inset-0 bg-[#0A2540]/20 dark:bg-[#00D4B3]/20 rounded-lg"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}
      </motion.button>

      {/* Overlay de fondo en móvil */}
      <AnimatePresence>
        {isDropdownOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99]"
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Dropdown de Notificaciones */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.2 
            }}
            className={`${
              isMobile 
                ? 'fixed left-4 right-4 w-auto' 
                : 'absolute right-0 w-80 sm:w-96'
            } ${isMobile ? '' : 'mt-2'} bg-white dark:bg-[#1E2329] rounded-xl shadow-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 py-2 z-[100] ${
              isMobile 
                ? '' 
                : 'max-h-[calc(100vh-8rem)]'
            } overflow-hidden`}
            style={isMobile ? {
              top: `${dropdownPosition.top}px`,
              maxHeight: `${dropdownPosition.maxHeight}px`
            } : {}}
          >
            {/* Header minimalista */}
            <div className="px-4 py-3 border-b border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative flex-shrink-0">
                  <div className="relative bg-[#0A2540]/10 dark:bg-[#0A2540]/20 p-1.5 rounded-lg">
                    <Bell className="w-4 h-4 text-[#0A2540] dark:text-[#00D4B3]" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-[#0A2540] dark:text-white flex items-center gap-2">
                    <span className="truncate">Notificaciones</span>
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-2 py-0.5 bg-[#0A2540]/10 dark:bg-[#00D4B3]/20 text-[#0A2540] dark:text-[#00D4B3] text-xs font-semibold rounded-md flex-shrink-0"
                      >
                        {unreadCount}
                      </motion.span>
                    )}
                  </h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-[#6C757D] dark:text-gray-400 mt-0.5 truncate">
                      {unreadCount === 1 ? '1 sin leer' : `${unreadCount} sin leer`}
                    </p>
                  )}
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-[#0A2540] dark:text-[#00D4B3] hover:text-[#0d2f4d] dark:hover:text-[#00C4A3] transition-all duration-200 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#0A2540]/10 dark:hover:bg-[#0A2540]/20 flex-shrink-0"
                  disabled={isLoading}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Marcar todas</span>
                </button>
              )}
            </div>

            {/* Lista de Notificaciones */}
            <div className="max-h-[calc(100vh-16rem)] sm:max-h-[20rem] overflow-y-auto scrollbar-thin-dark bg-white dark:bg-[#1E2329]">
              {isLoading && notifications.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-[3px] border-[#0A2540]/20 dark:border-[#00D4B3]/20 border-t-[#0A2540] dark:border-t-[#00D4B3] rounded-full mx-auto mb-4"
                  />
                  <p className="text-[#6C757D] dark:text-gray-400 text-sm font-medium">Cargando notificaciones...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="relative mx-auto mb-4 w-14 h-14"
                  >
                    <div className="relative bg-[#E9ECEF]/50 dark:bg-[#0A2540]/20 p-3 rounded-full">
                      <Bell className="w-7 h-7 text-[#6C757D] dark:text-gray-400 mx-auto" />
                    </div>
                  </motion.div>
                  <p className="text-[#0A2540] dark:text-white text-sm font-semibold mb-1">No hay notificaciones</p>
                  <p className="text-[#6C757D] dark:text-gray-400 text-xs">Recibirás notificaciones cuando haya actividad</p>
                </div>
              ) : (
                <div className="py-2">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.notification_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className={`relative px-3 sm:px-5 py-3 sm:py-4 border-l-4 ${getNotificationColor(notification.notification_type)} ${getPriorityBg(notification.priority, notification.status === 'unread')} transition-all duration-200 cursor-pointer group`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Indicador de no leída */}
                      {notification.status === 'unread' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#0A2540] dark:bg-[#00D4B3] rounded-full -ml-1"
                        />
                      )}
                      
                      <div className="flex items-start gap-2 sm:gap-3">
                        {/* Icono según tipo de notificación con fondo */}
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`p-1.5 sm:p-2 rounded-lg ${getNotificationBgColor(notification.notification_type)}`}>
                            {getNotificationIconByType(notification.notification_type)}
                          </div>
                        </div>
                        
                        {/* Contenido */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 sm:gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                                    <p className={`text-xs sm:text-sm font-semibold ${
                                      notification.status === 'unread' 
                                        ? 'text-[#0A2540] dark:text-white' 
                                        : 'text-[#0A2540] dark:text-gray-300'
                                    } truncate`}>
                                      {notification.title}
                                    </p>
                                    {notification.status === 'unread' && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-1.5 h-1.5 bg-[#0A2540] dark:bg-[#00D4B3] rounded-full flex-shrink-0"
                                      />
                                    )}
                                  </div>
                                  
                                  <p className="text-xs text-[#6C757D] dark:text-gray-400 mt-1 sm:mt-1.5 line-clamp-2 sm:line-clamp-2 leading-relaxed">
                                    {notification.message}
                                  </p>
                                  
                                  <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                                    <p className="text-xs text-[#6C757D] dark:text-gray-500">
                                      {formatDistanceToNow(new Date(notification.created_at), { 
                                        addSuffix: true, 
                                        locale: es 
                                      })}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Botones de acción */}
                                <div className="flex items-center gap-0.5 sm:gap-1 opacity-60 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                                  {notification.status === 'unread' && (
                                    <button
                                      onClick={(e) => handleMarkAsRead(e, notification.notification_id)}
                                      className="p-1.5 rounded-md text-[#6C757D] dark:text-gray-400 hover:text-[#10B981] dark:hover:text-[#10B981] hover:bg-[#10B981]/10 transition-all duration-200 active:scale-95"
                                      title="Marcar como leída"
                                      aria-label="Marcar como leída"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => handleArchive(e, notification.notification_id)}
                                    className="p-1.5 rounded-md text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-[#00D4B3] hover:bg-[#0A2540]/10 dark:hover:bg-[#0A2540]/20 transition-all duration-200 active:scale-95"
                                    title="Archivar"
                                    aria-label="Archivar notificación"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDelete(e, notification.notification_id)}
                                    className="p-1.5 rounded-md text-[#6C757D] dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 active:scale-95"
                                    title="Eliminar"
                                    aria-label="Eliminar notificación"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329]">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-center text-xs sm:text-sm text-[#0A2540] dark:text-[#00D4B3] hover:text-[#0d2f4d] dark:hover:text-[#00C4A3] transition-all duration-200 flex items-center justify-center gap-2 font-medium group"
                >
                  <span className="truncate">Ver todas las notificaciones</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex-shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#0A2540] dark:text-[#00D4B3] group-hover:text-[#0d2f4d] dark:group-hover:text-[#00C4A3]" />
                  </motion.div>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

