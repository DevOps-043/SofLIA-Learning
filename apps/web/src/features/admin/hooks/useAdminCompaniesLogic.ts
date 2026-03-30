'use client'

import { useState, useMemo } from 'react'
import { useAdminCompanies } from './useAdminCompanies'
import { AdminCompany } from '../services/adminCompanies.service'
import type { CreateCompanyData } from '../components/AdminCreateCompanyModal'
import { useThemeStore } from '@/core/stores/themeStore'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'

const colors = {
  primary: '#0A2540',
  accent: '#00D4B3',
  accentLight: '#00E5C4',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  purple: '#8B5CF6',
  bgPrimary: '#0F1419',
  bgSecondary: '#1E2329',
  bgTertiary: '#0A0D12',
  grayLight: '#E9ECEF',
  grayMedium: '#6C757D',
}

export function useAdminCompaniesLogic() {
  const { companies, stats, isLoading, error, refetch, updatingId, updateCompany, createCompany, actionError } = useAdminCompanies()
  const [searchTerm, setSearchTerm] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewCompany, setViewCompany] = useState<AdminCompany | null>(null)
  const [editCompany, setEditCompany] = useState<AdminCompany | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const { resolvedTheme } = useThemeStore()
  const isLightTheme = resolvedTheme === 'light'
  const { styles: orgStyles } = useOrganizationStylesContext()
  const panelStyles = orgStyles?.panel

  const themeColors = {
    background: isLightTheme ? (panelStyles?.background_value && panelStyles.background_value !== '#0F1419' ? panelStyles.background_value : '#F8FAFC') : colors.bgPrimary,
    cardBackground: isLightTheme ? (panelStyles?.card_background && panelStyles.card_background !== '#1E2329' ? panelStyles.card_background : '#FFFFFF') : colors.bgSecondary,
    textPrimary: isLightTheme ? '#1E293B' : 'white',
    textSecondary: isLightTheme ? '#64748B' : colors.grayMedium,
    borderColor: isLightTheme ? '#E2E8F0' : colors.grayMedium,
    inputBg: isLightTheme ? '#F1F5F9' : colors.bgTertiary,
  }

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        company.name.toLowerCase().includes(searchLower) ||
        (company.slug?.toLowerCase().includes(searchLower) ?? false) ||
        (company.contact_email?.toLowerCase().includes(searchLower) ?? false)

      const matchesPlan =
        planFilter === 'all' ||
        company.subscription_plan?.toLowerCase() === planFilter

      const normalizedStatus = company.subscription_status?.toLowerCase()
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && company.is_active && normalizedStatus !== 'trial') ||
        (statusFilter === 'trial' && normalizedStatus === 'trial') ||
        (statusFilter === 'pending' && normalizedStatus === 'pending' && !company.is_active) ||
        (statusFilter === 'paused' && !company.is_active && normalizedStatus !== 'pending') ||
        (statusFilter === 'expired' && normalizedStatus === 'expired')

      return matchesSearch && matchesPlan && matchesStatus
    })
  }, [companies, planFilter, searchTerm, statusFilter])

  const handleToggle = async (company: AdminCompany) => {
    await updateCompany(company.id, { is_active: !company.is_active })
  }

  const handleActivatePending = async (company: AdminCompany) => {
    await updateCompany(company.id, { is_active: true, subscription_status: 'active' })
  }

  const handleSaveEdit = async (updates: Partial<AdminCompany>) => {
    if (!editCompany) return
    setIsSaving(true)
    try {
      await updateCompany(editCompany.id, updates)
      setEditCompany(null)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateCompany = async (data: CreateCompanyData) => {
    setIsCreating(true)
    try {
      await createCompany(data)
      setShowCreateModal(false)
    } finally {
      setIsCreating(false)
    }
  }

  return {
    companies,
    stats,
    isLoading,
    error,
    refetch,
    updatingId,
    actionError,
    searchTerm, setSearchTerm,
    planFilter, setPlanFilter,
    statusFilter, setStatusFilter,
    viewCompany, setViewCompany,
    editCompany, setEditCompany,
    isSaving,
    showCreateModal, setShowCreateModal,
    isCreating,
    themeColors,
    filteredCompanies,
    handleToggle,
    handleActivatePending,
    handleSaveEdit,
    handleCreateCompany,
  }
}
