'use client'

import { useState, useMemo } from 'react'
import { useAdminCompanies } from './useAdminCompanies'
import type { AdminCompany } from '../types/admin-companies.types'
import type { CreateCompanyData } from '../components/AdminCreateCompanyModal'
import { useThemeStore } from '../../../core/stores/themeStore'
import { useOrganizationStylesContext } from '../../business-panel/contexts/OrganizationStylesContext'
import {
  adminCompaniesColors,
  filterAdminCompanies,
  type AdminCompaniesThemeColors,
} from '../services/admin-companies'

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

  const themeColors: AdminCompaniesThemeColors = {
    background: isLightTheme ? (panelStyles?.background_value && panelStyles.background_value !== '#0F1419' ? panelStyles.background_value : '#F8FAFC') : adminCompaniesColors.bgPrimary,
    cardBackground: isLightTheme ? (panelStyles?.card_background && panelStyles.card_background !== '#1E2329' ? panelStyles.card_background : '#FFFFFF') : adminCompaniesColors.bgSecondary,
    textPrimary: isLightTheme ? '#1E293B' : 'white',
    textSecondary: isLightTheme ? '#64748B' : adminCompaniesColors.grayMedium,
    borderColor: isLightTheme ? '#E2E8F0' : adminCompaniesColors.grayMedium,
    inputBg: isLightTheme ? '#F1F5F9' : adminCompaniesColors.bgTertiary,
  }

  const filteredCompanies = useMemo(() => {
    return filterAdminCompanies(companies, {
      searchTerm,
      planFilter,
      statusFilter,
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
