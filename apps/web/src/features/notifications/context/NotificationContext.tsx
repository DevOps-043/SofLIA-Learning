'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import useSWR from 'swr'
import { Notification } from '../services/notification.service'
import { useAuth } from '@/features/auth/hooks/useAuth'

/**
 * Interfaz para el contexto de notificaciones
 */
interface NotificationContextType {
  // Datos
  notifications: Notification[]
  unreadCount: number
  criticalCount: number
  highCount: number
  
  // Estado
  isLoading: boolean
  error: Error | null
  
  // Acciones
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  archiveNotification: (notificationId: string) => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  refreshNotifications: () => Promise<void>
  
  // Estado del dropdown
  isDropdownOpen: boolean
  setIsDropdownOpen: (open: boolean) => void
}

/**
 * Contexto de notificaciones
 */
const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

/**
 * Props del provider
 */
interface NotificationProviderProps {
  children: ReactNode
  /**
   * Intervalo de polling en milisegundos (default: 30000 = 30 segundos)
   * Set a 0 para desactivar polling automático
   */
  pollingInterval?: number
}

/**
 * Provider de notificaciones global
 *
 * ✅ OPTIMIZACIÓN: Polling reducido de 30s a 60s
 * ✅ OPTIMIZACIÓN: Deduping aumentado de 2s a 5s
 * ✅ FIX: Revalidación siempre activa para mantener datos actualizados
 * ✅ FIX: Revalidación inicial al montar para cargar datos frescos
 *
 * Proporciona acceso a notificaciones en toda la aplicación
 * Usa SWR para cache y revalidación automática
 */
export function NotificationProvider({
  children,
  pollingInterval = 60000  // ✅ OPTIMIZACIÓN: De 30s a 60s (50% menos requests)
}: NotificationProviderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { user, loading: authLoading, isAuthenticated } = useAuth()

  // Marcar como montado después del primer render
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Solo hacer llamadas si el usuario está autenticado
  const shouldFetch = isMounted && !authLoading && isAuthenticated && !!user

  // Obtener notificaciones no leídas
  const {
    data: notificationsData,
    error: notificationsError,
    mutate: mutateNotifications,
    isLoading: isLoadingNotifications
  } = useSWR<{ success: boolean; data: { notifications: Notification[]; total: number } }>(
    shouldFetch ? '/api/notifications?status=unread&limit=10&orderBy=created_at&orderDirection=desc' : null,
    {
      refreshInterval: shouldFetch ? pollingInterval : 0, // Desactivar polling si no está autenticado
      revalidateOnFocus: shouldFetch,  // Solo revalidar si está autenticado
      revalidateOnReconnect: shouldFetch,
      dedupingInterval: 5000,  // ✅ De 2s a 5s para evitar requests duplicados
      revalidateIfStale: shouldFetch,  // Solo revalidar si está autenticado
      onError: (error) => {
        // Ignorar errores 401 (no autenticado) - es esperado cuando no hay sesión
        if (error instanceof Error && error.message.includes('401')) {
          return
        }
      }
    }
  )

  // Obtener conteo de no leídas
  const {
    data: countData,
    error: countError,
    mutate: mutateCount
  } = useSWR<{ success: boolean; data: { total: number; critical: number; high: number } }>(
    shouldFetch ? '/api/notifications/unread-count' : null,
    {
      refreshInterval: shouldFetch ? pollingInterval : 0, // Desactivar polling si no está autenticado
      revalidateOnFocus: shouldFetch,  // Solo revalidar si está autenticado
      revalidateOnReconnect: shouldFetch,
      dedupingInterval: 5000,  // ✅ De 2s a 5s
      revalidateIfStale: shouldFetch,  // Solo revalidar si está autenticado
      onError: (error) => {
        // Ignorar errores 401 (no autenticado) - es esperado cuando no hay sesión
        if (error instanceof Error && error.message.includes('401')) {
          return
        }
      }
    }
  )

  // Extraer y ordenar notificaciones por prioridad (critical > high > medium > low)
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  const notifications = (notificationsData?.data?.notifications || []).sort((a, b) => {
    const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2
    const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }
    // Si tienen la misma prioridad, ordenar por fecha (más recientes primero)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
  const unreadCount = countData?.data?.total || 0
  const criticalCount = countData?.data?.critical || 0
  const highCount = countData?.data?.high || 0

  // Marcar notificación como leída
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Error al marcar notificación como leída')
      }

      // Revalidar datos
      await Promise.all([
        mutateNotifications(),
        mutateCount()
      ])
    } catch (error) {
      throw error
    }
  }

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Error al marcar todas como leídas')
      }

      // Revalidar datos
      await Promise.all([
        mutateNotifications(),
        mutateCount()
      ])
    } catch (error) {
      throw error
    }
  }

  // Archivar notificación
  const archiveNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/archive`, {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Error al archivar notificación')
      }

      // Revalidar datos
      await Promise.all([
        mutateNotifications(),
        mutateCount()
      ])
    } catch (error) {
      throw error
    }
  }

  // Eliminar notificación
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar notificación')
      }

      // Revalidar datos
      await Promise.all([
        mutateNotifications(),
        mutateCount()
      ])
    } catch (error) {
      throw error
    }
  }

  // Refrescar notificaciones manualmente
  const refreshNotifications = async () => {
    await Promise.all([
      mutateNotifications(),
      mutateCount()
    ])
  }

  // Forzar revalidación inicial al montar solo si está autenticado
  useEffect(() => {
    if (shouldFetch) {
      // Revalidar inmediatamente al montar para asegurar datos frescos
      mutateNotifications()
      mutateCount()
    }
  }, [shouldFetch, mutateNotifications, mutateCount])

  // Escuchar evento personalizado para refrescar notificaciones
  useEffect(() => {
    const handleRefresh = async () => {
      await Promise.all([
        mutateNotifications(),
        mutateCount()
      ])
    }

    window.addEventListener('refresh-notifications', handleRefresh)
    
    return () => {
      window.removeEventListener('refresh-notifications', handleRefresh)
    }
  }, [mutateNotifications, mutateCount])

  // Determinar si hay error
  const error = notificationsError || countError || null

  // Determinar si está cargando
  const isLoading = isLoadingNotifications

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    criticalCount,
    highCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    refreshNotifications,
    isDropdownOpen,
    setIsDropdownOpen
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

/**
 * Hook para usar el contexto de notificaciones
 * 
 * @throws Error si se usa fuera del NotificationProvider
 */
export function useNotifications() {
  const context = useContext(NotificationContext)
  
  if (context === undefined) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider')
  }
  
  return context
}

