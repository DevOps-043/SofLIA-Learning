'use client'

import { useState, useEffect } from 'react'
import { AdminApp, AdminAppsService, AppStats } from '../services/adminApps.service'

export function useAdminApps() {
  const [apps, setApps] = useState<AdminApp[]>([])
  const [stats, setStats] = useState<AppStats>({
    totalApps: 0,
    activeApps: 0,
    featuredApps: 0,
    totalLikes: 0,
    totalViews: 0,
    averageRating: 0,
    verifiedApps: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [appsData, statsData] = await Promise.all([
        AdminAppsService.getApps(),
        AdminAppsService.getAppStats()
      ])

      setApps(appsData)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  const createApp = async (appData: Partial<AdminApp>) => {
    try {
      // TODO: Obtener el ID del usuario admin desde el contexto de autenticación
      const adminUserId = 'admin-user-id' // Esto debería venir del contexto de auth
      const newApp = await AdminAppsService.createApp(appData, adminUserId)
      
      // Actualizar estado local sin recargar
      setApps(prevApps => [newApp, ...prevApps])
      setStats(prevStats => ({
        ...prevStats,
        totalApps: prevStats.totalApps + 1,
        activeApps: prevStats.activeApps + (newApp.is_active ? 1 : 0),
        featuredApps: prevStats.featuredApps + (newApp.is_featured ? 1 : 0),
        verifiedApps: prevStats.verifiedApps + (newApp.is_verified ? 1 : 0)
      }))
      
      return newApp
    } catch (err) {
      throw err
    }
  }

  const updateApp = async (appId: string, appData: Partial<AdminApp>) => {
    try {
      const updatedApp = await AdminAppsService.updateApp(appId, appData)
      
      // Actualizar estado local sin recargar
      setApps(prevApps => 
        prevApps.map(app => 
          app.app_id === appId ? { ...app, ...updatedApp } : app
        )
      )
      
      return updatedApp
    } catch (err) {
      throw err
    }
  }

  const deleteApp = async (appId: string) => {
    try {
      await AdminAppsService.deleteApp(appId)
      
      // Actualizar estado local sin recargar
      const deletedApp = apps.find(app => app.app_id === appId)
      if (deletedApp) {
        setApps(prevApps => prevApps.filter(app => app.app_id !== appId))
        setStats(prevStats => ({
          ...prevStats,
          totalApps: prevStats.totalApps - 1,
          activeApps: prevStats.activeApps - (deletedApp.is_active ? 1 : 0),
          featuredApps: prevStats.featuredApps - (deletedApp.is_featured ? 1 : 0),
          verifiedApps: prevStats.verifiedApps - (deletedApp.is_verified ? 1 : 0)
        }))
      }
    } catch (err) {
      throw err
    }
  }

  const toggleAppStatus = async (appId: string, isActive: boolean) => {
    try {
      await AdminAppsService.toggleAppStatus(appId, isActive)
      
      // Actualizar estado local sin recargar
      setApps(prevApps => 
        prevApps.map(app => 
          app.app_id === appId ? { ...app, is_active: isActive } : app
        )
      )
      setStats(prevStats => ({
        ...prevStats,
        activeApps: prevStats.activeApps + (isActive ? 1 : -1)
      }))
    } catch (err) {
      throw err
    }
  }

  const toggleAppFeatured = async (appId: string, isFeatured: boolean) => {
    try {
      await AdminAppsService.toggleAppFeatured(appId, isFeatured)
      
      // Actualizar estado local sin recargar
      setApps(prevApps => 
        prevApps.map(app => 
          app.app_id === appId ? { ...app, is_featured: isFeatured } : app
        )
      )
      setStats(prevStats => ({
        ...prevStats,
        featuredApps: prevStats.featuredApps + (isFeatured ? 1 : -1)
      }))
    } catch (err) {
      throw err
    }
  }

  const toggleAppVerified = async (appId: string, isVerified: boolean) => {
    try {
      await AdminAppsService.toggleAppVerified(appId, isVerified)
      
      // Actualizar estado local sin recargar
      setApps(prevApps => 
        prevApps.map(app => 
          app.app_id === appId ? { ...app, is_verified: isVerified } : app
        )
      )
      setStats(prevStats => ({
        ...prevStats,
        verifiedApps: prevStats.verifiedApps + (isVerified ? 1 : -1)
      }))
    } catch (err) {
      throw err
    }
  }


  useEffect(() => {
    fetchData()
  }, [])

  return {
    apps,
    stats,
    isLoading,
    error,
    refetch: fetchData,
    createApp,
    updateApp,
    deleteApp,
    toggleAppStatus,
    toggleAppFeatured,
    toggleAppVerified
  }
}
