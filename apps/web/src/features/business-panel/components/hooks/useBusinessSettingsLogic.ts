'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Building2, Palette } from 'lucide-react'
import { useBusinessSettings } from '../../hooks/useBusinessSettings'
import { useSubscriptionFeatures } from '../../hooks/useSubscriptionFeatures'
import { useOrganizationStylesContext } from '../../contexts/OrganizationStylesContext'
import { useBranding } from '../../hooks/useBranding'
import { useThemeStore } from '@/core/stores/themeStore'

export function useBusinessSettingsLogic() {
  const { data, isLoading, error, refetch, updateOrganization } = useBusinessSettings()
  const { branding, isLoading: isLoadingBranding, updateBranding, detectColors } = useBranding()
  const { plan, canUse, refetch: refetchSubscription } = useSubscriptionFeatures()
  const { refetch: refetchStyles } = useOrganizationStylesContext()
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const [activeTab, setActiveTab] = useState<'organization' | 'branding' | 'personalization'>('organization')
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

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
    { id: 'organization' as const, label: 'Datos de la Empresa', icon: Building2, color: '#3b82f6' },
    ...(canUseBranding ? [{ id: 'branding' as const, label: 'Branding', icon: Palette, color: '#8b5cf6' }] : []),
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
    isDark,
    // Tab state
    activeTab,
    setActiveTab,
    tabs,
    // Save feedback state
    saveSuccess,
    setSaveSuccess,
    saveError,
    setSaveError,
    // Computed
    canUseBranding,
    isEnterprise,
  }
}
