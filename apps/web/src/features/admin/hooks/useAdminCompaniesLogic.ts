'use client'

import { useState, useMemo } from 'react'
import { useAdminCompanies } from './useAdminCompanies'
import type { AdminCompany } from '../types/admin-companies.types'
import type { CreateCompanyData } from '../components/AdminCreateCompanyModal'
import { useAdminTheme } from './useAdminTheme'
import {
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

  const adminTheme = useAdminTheme()

  const themeColors: AdminCompaniesThemeColors = {
    background: adminTheme.background,
    cardBackground: adminTheme.surface,
    textPrimary: adminTheme.text,
    textSecondary: adminTheme.textMuted,
    borderColor: adminTheme.border,
    inputBg: adminTheme.surfaceSubtle,
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
