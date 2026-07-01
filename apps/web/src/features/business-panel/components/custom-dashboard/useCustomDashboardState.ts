'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ToastType } from '@/core/components/ToastNotification/ToastNotification'
import type { DashboardLayout, WidgetConfig, WidgetType } from './custom-dashboard.types'
import { fetchDashboardLayout, resetDashboardLayout, saveDashboardLayout } from './custom-dashboard.api'
import { addWidgetToLayout, removeWidgetFromLayout, replaceWidgets } from './dashboard-layout.utils'

export function useCustomDashboardState(orgSlug: string) {
  const { t: tc } = useTranslation('common')
  const [isEditMode, setIsEditMode] = useState(false)
  const [layout, setLayout] = useState<DashboardLayout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>(
    { isOpen: false, message: '', type: 'success' }
  )
  const showToast = useCallback((message: string, type: ToastType = 'success') =>
    setToast({ isOpen: true, message, type }), [])
  const hideToast = useCallback(() =>
    setToast(prev => ({ ...prev, isOpen: false })), [])
  const [pendingReset, setPendingReset] = useState(false)

  const fetchLayout = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      setLayout(await fetchDashboardLayout(orgSlug))
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Error al cargar el layout')
    } finally {
      setIsLoading(false)
    }
  }, [orgSlug])

  useEffect(() => {
    void fetchLayout()
  }, [fetchLayout])

  const handleLayoutChange = useCallback((newLayout: WidgetConfig[]) => {
    setLayout(currentLayout => replaceWidgets(currentLayout, newLayout))
  }, [])

  const handleSave = async () => {
    if (!layout) return

    try {
      setIsSaving(true)
      await saveDashboardLayout(orgSlug, layout)
      setIsEditMode(false)
      showToast(tc('actions.savedSuccessfully'), 'success')
    } catch (saveIssue) {
      showToast(
        saveIssue instanceof Error ? saveIssue.message : 'Error al guardar el layout',
        'error',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmReset = async () => {
    setPendingReset(false)
    try {
      setIsSaving(true)
      await resetDashboardLayout(orgSlug)
      await fetchLayout()
      setIsEditMode(false)
      showToast(tc('actions.savedSuccessfully'), 'success')
    } catch (resetIssue) {
      showToast(
        resetIssue instanceof Error ? resetIssue.message : 'Error al restablecer el layout',
        'error',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return {
    addWidget: (widgetType: WidgetType) => setLayout(currentLayout => addWidgetToLayout(currentLayout, widgetType)),
    error,
    fetchLayout,
    handleConfirmReset,
    handleLayoutChange,
    handleReset: () => setPendingReset(true),
    handleSave,
    hideToast,
    isEditMode,
    isLoading,
    isSaving,
    layout,
    pendingReset,
    removeWidget: (widgetId: string) => setLayout(currentLayout => removeWidgetFromLayout(currentLayout, widgetId)),
    setIsEditMode,
    setPendingReset,
    toast,
  }
}
