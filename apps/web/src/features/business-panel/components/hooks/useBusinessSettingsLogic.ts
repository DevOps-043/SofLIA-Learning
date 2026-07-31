'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Building2, KeyRound, Palette } from 'lucide-react'
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

  const [activeTab, setActiveTab] = useState<'organization' | 'access' | 'branding'>('organization')
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
    {
      id: 'organization' as const,
      label: 'Identidad y contexto',
      description: 'Información esencial de la organización',
      icon: Building2,
    },
    {
      id: 'access' as const,
      label: 'Acceso y autenticación',
      description: 'Enlaces de ingreso y proveedores SSO',
      icon: KeyRound,
    },
    ...(canUseBranding
      ? [{
          id: 'branding' as const,
          label: 'Marca visual',
          description: 'Logotipo, color y vista previa',
          icon: Palette,
        }]
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
