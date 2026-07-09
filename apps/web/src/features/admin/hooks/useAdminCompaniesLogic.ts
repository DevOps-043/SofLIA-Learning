'use client'

import { useState, useMemo } from 'react'
import { useAdminCompanies } from './useAdminCompanies'
import type { AdminCompany } from '../types/admin-companies.types'
import type { CreateCompanyData } from '../components/admin-create-company-modal'
import { useAdminPanelTheme } from './useAdminPanelTheme'
import {
  filterAdminCompanies,
  type AdminCompaniesThemeColors,
} from '../services/admin-companies'
import type { CompaniesViewMode } from '../components/admin-companies'

export function useAdminCompaniesLogic() {
  const { companies, stats, isLoading, error, refetch, updatingId, updateCompany, createCompany, actionError } = useAdminCompanies()
  const [searchTerm, setSearchTerm] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewCompany, setViewCompany] = useState<AdminCompany | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [viewMode, setViewMode] = useState<CompaniesViewMode>('grid')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const theme = useAdminPanelTheme()

  const themeColors: AdminCompaniesThemeColors = {
    background: theme.panelBg,
    cardBackground: theme.cardBg,
    textPrimary: theme.textColor,
    textSecondary: theme.subtextColor,
    borderColor: theme.borderColor,
    inputBg: theme.inputBg,
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

  const handleCreateCompany = async (data: CreateCompanyData) => {
    setIsCreating(true)
    try {
      await createCompany(data)
      setShowCreateModal(false)
    } finally {
      setIsCreating(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  return {
    companies,
    stats,
    isLoading,
    error,
    refetch: handleRefresh,
    updatingId,
    actionError,
    isRefreshing,
    searchTerm, setSearchTerm,
    planFilter, setPlanFilter,
    statusFilter, setStatusFilter,
    viewCompany, setViewCompany,
    showCreateModal, setShowCreateModal,
    isCreating,
    viewMode, setViewMode,
    themeColors,
    filteredCompanies,
    handleToggle,
    handleActivatePending,
    handleCreateCompany,
  }
}
