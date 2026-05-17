'use client'

import { useCallback, useEffect, useState } from 'react'
import type { DashboardLayout, WidgetConfig, WidgetType } from './custom-dashboard.types'
import { fetchDashboardLayout, resetDashboardLayout, saveDashboardLayout } from './custom-dashboard.api'
import { addWidgetToLayout, removeWidgetFromLayout, replaceWidgets } from './dashboard-layout.utils'

export function useCustomDashboardState(orgSlug: string) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [layout, setLayout] = useState<DashboardLayout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
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
      setError(null)
      setSaveSuccess(false)
      await saveDashboardLayout(orgSlug, layout)
      setSaveSuccess(true)
      window.setTimeout(() => {
        setSaveSuccess(false)
        setIsEditMode(false)
      }, 2000)
    } catch (saveIssue) {
      setError(saveIssue instanceof Error ? saveIssue.message : 'Error al guardar el layout')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmReset = async () => {
    setPendingReset(false)
    try {
      setIsSaving(true)
      setError(null)
      await resetDashboardLayout(orgSlug)
      await fetchLayout()
      setIsEditMode(false)
      setSaveSuccess(true)
      window.setTimeout(() => setSaveSuccess(false), 2000)
    } catch (resetIssue) {
      setError(resetIssue instanceof Error ? resetIssue.message : 'Error al restablecer el layout')
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
    isEditMode,
    isLoading,
    isSaving,
    layout,
    pendingReset,
    removeWidget: (widgetId: string) => setLayout(currentLayout => removeWidgetFromLayout(currentLayout, widgetId)),
    saveSuccess,
    setIsEditMode,
    setPendingReset,
  }
}
