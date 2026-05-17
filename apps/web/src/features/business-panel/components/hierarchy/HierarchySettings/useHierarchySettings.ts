'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHierarchy } from '../../../hooks/useHierarchy'

export function useHierarchySettings() {
  const { t } = useTranslation('business')
  const hierarchy = useHierarchy()
  const [showConfirmEnable, setShowConfirmEnable] = useState(false)
  const [showConfirmDisable, setShowConfirmDisable] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    hierarchy.loadConfig()
    hierarchy.loadStats()
  }, [hierarchy.loadConfig, hierarchy.loadStats])

  async function handleCreateStructure() {
    setActionError(null)
    const result = await hierarchy.seedDefaultStructure()
    if (!result.success) {
      setActionError(result.error || t('hierarchy.errorCreateStructure'))
    }
  }

  async function handleEnableHierarchy() {
    setActionError(null)
    const result = await hierarchy.enableHierarchy()
    if (result.success) {
      setShowConfirmEnable(false)
      return
    }
    setActionError(result.error || t('hierarchy.errorEnable'))
  }

  async function handleDisableHierarchy() {
    setActionError(null)
    const result = await hierarchy.disableHierarchy()
    if (result.success) {
      setShowConfirmDisable(false)
      return
    }
    setActionError(result.error || t('hierarchy.errorDisable'))
  }

  function clearVisibleErrors() {
    hierarchy.clearError()
    setActionError(null)
  }

  return {
    ...hierarchy,
    actionError,
    clearVisibleErrors,
    handleCreateStructure,
    handleDisableHierarchy,
    handleEnableHierarchy,
    isInitialLoading: hierarchy.isLoadingConfig || hierarchy.isLoadingStats,
    setShowConfirmDisable,
    setShowConfirmEnable,
    showConfirmDisable,
    showConfirmEnable,
  }
}
