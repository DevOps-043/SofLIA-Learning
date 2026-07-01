'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Building2, Palette } from 'lucide-react'
import type { ToastType } from '@/core/components/ToastNotification/ToastNotification'
import { useBusinessSettings } from '../../hooks/useBusinessSettings'
import { useSubscriptionFeatures } from '../../hooks/useSubscriptionFeatures'
import { useOrganizationStylesContext } from '../../contexts/OrganizationStylesContext'
import { useBranding } from '../../hooks/useBranding'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

export function useBusinessSettingsLogic() {
  const { data, isLoading, error, refetch, updateOrganization } = useBusinessSettings()
  const { branding, isLoading: isLoadingBranding, updateBranding, detectColors } = useBranding()
  const { plan, canUse, refetch: refetchSubscription } = useSubscriptionFeatures()
  const { refetch: refetchStyles } = useOrganizationStylesContext()
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined
  const theme = useBusinessPanelTheme()

  const [activeTab, setActiveTab] = useState<'organization' | 'branding'>('organization')
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>(
    { isOpen: false, message: '', type: 'success' }
  )
  const showToast = useCallback((message: string, type: ToastType = 'success') =>
    setToast({ isOpen: true, message, type }), [])
  const hideToast = useCallback(() =>
    setToast(prev => ({ ...prev, isOpen: false })), [])

  const canUseBranding = canUse('corporate_branding')
  const isEnterprise = plan === 'enterprise'

  useEffect(() => {
    const handlePlanChange = () => {
      refetchSubscription()
      refetch()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('subscription-plan-changed', handlePlanChange)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('subscription-plan-changed', handlePlanChange)
      }
    }
  }, [refetchSubscription, refetch])

  const tabs = [
    { id: 'organization' as const, label: 'Datos de la Empresa', icon: Building2, color: theme.actionColor },
    ...(canUseBranding
      ? [{ id: 'branding' as const, label: 'Branding', icon: Palette, color: theme.isDark ? theme.secondaryColor : 'var(--color-secondary)' }]
      : []),
  ]

  return {
    // Data from hooks
    data,
    isLoading,
    error,
    refetch,
    updateOrganization,
    branding,
    isLoadingBranding,
    updateBranding,
    detectColors,
    refetchStyles,
    orgSlug,
    isDark: theme.isDark,
    // Tab state
    activeTab,
    setActiveTab,
    tabs,
    // Toast feedback
    toast,
    showToast,
    hideToast,
    // Computed
    canUseBranding,
    isEnterprise,
  }
}
