'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Users,
  Plus,
  Search,
  Shield,
  Edit,
  Trash,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Download,
  BarChart3,
  Sparkles,
  UserPlus,
  Crown,
  Activity,
  ChevronRight,
  Eye,
  LayoutGrid,
  List,
  MapPin,
  Building2,
  Network,
  Filter,
  X,
  Link2,
  Pause,
  Play,
  Trash2,
  Calendar,
  Clock
} from 'lucide-react'
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import { BusinessUser, BusinessInvitation, BulkInviteLink } from '@/features/business-panel/services/businessUsers.service'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/core/stores/themeStore'
import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'
import { useBusinessUsersPageLogic } from '@/features/business-panel/hooks/useBusinessUsersPageLogic'
import { StatCard } from './components/StatCard'
import { UserCard } from './components/UserCard'
import { InvitationCard } from './components/InvitationCard'
import { InvitationListRow } from './components/InvitationListRow'
import { EmptyState } from './components/EmptyState'
import { InviteLinkCard } from './components/InviteLinkCard'
import { InviteLinkRow } from './components/InviteLinkRow'
import { UserListRow } from './components/UserListRow'

const AddUserModal = dynamic(() => import('@/features/business-panel/components/BusinessAddUserModal').then(mod => ({ default: mod.BusinessAddUserModal })), { ssr: false })
const EditUserModal = dynamic(() => import('@/features/business-panel/components/BusinessEditUserModal').then(mod => ({ default: mod.BusinessEditUserModal })), { ssr: false })
const DeleteUserModal = dynamic(() => import('@/features/business-panel/components/BusinessDeleteUserModal').then(mod => ({ default: mod.BusinessDeleteUserModal })), { ssr: false })
const ImportUsersModal = dynamic(() => import('@/features/business-panel/components/BusinessImportUsersModal').then(mod => ({ default: mod.BusinessImportUsersModal })), { ssr: false })
const UserStatsModal = dynamic(() => import('@/features/business-panel/components/BusinessUserStatsModal').then((mod) => ({ default: mod.BusinessUserStatsModal })), { ssr: false })
const UnifiedInviteModal = dynamic(() => import('@/features/business-panel/components/BusinessUnifiedInviteModal').then(mod => ({ default: mod.BusinessUnifiedInviteModal })), { ssr: false })


// ============================================
// PÁGINA PRINCIPAL: Users Management
// ============================================
export default function BusinessPanelUsersPage() {
  const { t } = useTranslation('business')
  const {
    orgSlug,
    users,
    invitations,
    inviteLinks,
    stats,
    orgData,
    isLoading,
    error,
    refetch,
    updateUser,
    filteredUsers,
    filteredInvitations,
    uniqueRegions,
    uniqueZones,
    uniqueTeams,
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    filterRole,
    setFilterRole,
    filterStatus,
    setFilterStatus,
    filterRegion,
    setFilterRegion,
    filterZone,
    setFilterZone,
    filterTeam,
    setFilterTeam,
    showAdvancedFilters,
    setShowAdvancedFilters,
    activeFiltersCount,
    clearAllFilters,
    isRoleDropdownOpen,
    setIsRoleDropdownOpen,
    isStatusDropdownOpen,
    setIsStatusDropdownOpen,
    isRegionDropdownOpen,
    setIsRegionDropdownOpen,
    isZoneDropdownOpen,
    setIsZoneDropdownOpen,
    isTeamDropdownOpen,
    setIsTeamDropdownOpen,
    editingUser,
    setEditingUser,
    deletingUser,
    setDeletingUser,
    isEditModalOpen,
    setIsEditModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isAddModalOpen,
    setIsAddModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    statsUser,
    setStatsUser,
    isStatsModalOpen,
    setIsStatsModalOpen,
    isUnifiedInviteModalOpen,
    setIsUnifiedInviteModalOpen,
    toast,
    setToast,
    handleSaveNewUser,
    resendInvitation,
    suspendUser,
    activateUser,
    deleteUser,
    updateInviteLinkStatus,
    deleteInviteLink,
    handleResendIndividualInvitation,
    handleRevokeInvitation,
    isDark,
    primaryColor,
    secondaryColor,
    accentColor,
  } = useBusinessUsersPageLogic()

  // Loading State
  if (isLoading) {
    return (
      <div className="p-6 min-h-screen animate-pulse">
        <div className="h-48 rounded-3xl bg-gray-800/50 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-800/50 rounded-2xl" />)}
        </div>
        <div className="h-12 bg-gray-800/50 rounded-xl mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-gray-800/50 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-8" style={{ color: 'var(--org-text-color, #FFFFFF)' }}>
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl p-8 group"
      >
        {/* Background Gradient */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            opacity: isDark ? 0.3 : 1
          }}
        />

        {/* Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />
        </div>

        {/* Animated Particles */}
        <motion.div
          animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-10 right-20 w-2 h-2 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
        <motion.div
          animate={{ y: [0, 10, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          className="absolute bottom-10 right-40 w-3 h-3 rounded-full"
          style={{ backgroundColor: accentColor }}
        />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-6 h-6" style={{ color: accentColor }} />
                </motion.div>
                <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: accentColor }}>
                  {t('sidebar.users')}
                </span>
              </div>

                <motion.h1
                  className="text-3xl lg:text-4xl font-bold mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}
                >
                  {t('users.title')}
                </motion.h1>

                <motion.p
                  className="text-lg max-w-xl"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(15,23,42,0.8)' }}
                >
                  {t('users.subtitle')}
                </motion.p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                onClick={async () => {
                  const response = await fetch('/api/business/users/template', { credentials: 'include' })
                  if (response.ok) {
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'plantilla-importacion-usuarios.csv'
                    a.click()
                  }
                }}

                className="px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors flex items-center gap-2"
                style={{
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                  backgroundColor: isDark ? 'transparent' : 'rgba(0,0,0,0.05)'
                }}
                whileHover={{ scale: 1.02, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-4 h-4" />
                {t('users.buttons.template')}
              </motion.button>

              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 }}
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors flex items-center gap-2"
                style={{
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                  backgroundColor: isDark ? 'transparent' : 'rgba(0,0,0,0.05)'
                }}
                whileHover={{ scale: 1.02, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                whileTap={{ scale: 0.98 }}
              >
                <Upload className="w-4 h-4" />
                {t('users.buttons.import', 'Importar')}
              </motion.button>

              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 }}
                onClick={() => setIsUnifiedInviteModalOpen(true)}
                className="px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors flex items-center gap-2"
                style={{
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                  backgroundColor: isDark ? 'transparent' : 'rgba(0,0,0,0.05)'
                }}
                whileHover={{ scale: 1.02, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                whileTap={{ scale: 0.98 }}
              >
                <Mail className="w-4 h-4" />
                {t('users.buttons.invite', 'Invitar')}
              </motion.button>

              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55 }}
                onClick={() => setIsAddModalOpen(true)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm !text-white transition-all flex items-center gap-2"
                style={{
                  backgroundColor: primaryColor,
                  color: '#FFFFFF',
                  boxShadow: `0 8px 30px ${primaryColor}40`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5 !text-white" color="#FFFFFF" strokeWidth={3} />
                <span className="!text-white font-bold" style={{ color: '#FFFFFF' }}>
                  {t('users.buttons.add')}
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <p className="text-sm text-amber-400">{t('users.error.loadFailed')}</p>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('users.stats.total')}
          value={stats.total}
          icon={<Users className="w-6 h-6" style={{ color: '#3B82F6' }} />}
          gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)"
          delay={0}
          trend={12}
          isDark={isDark}
        />
        <StatCard
          title={t('users.stats.active')}
          value={stats.active}
          icon={<CheckCircle className="w-6 h-6" style={{ color: '#10B981' }} />}
          gradient="linear-gradient(135deg, #10B981, #059669)"
          delay={1}
          trend={8}
          isDark={isDark}
        />
        <StatCard
          title={t('users.stats.invited')}
          value={stats.invited}
          icon={<Mail className="w-6 h-6" style={{ color: '#F59E0B' }} />}
          gradient="linear-gradient(135deg, #F59E0B, #D97706)"
          delay={2}
          isDark={isDark}
          onClick={() => setActiveTab('invitations')}
        />
        <StatCard
          title={t('users.stats.admins')}
          value={stats.admins}
          icon={<Shield className="w-6 h-6" style={{ color: '#A855F7' }} />}
          gradient="linear-gradient(135deg, #A855F7, #7C3AED)"
          delay={3}
          trend={5}
          isDark={isDark}
        />
      </div>

        {/* Tabs and Search Bar */}
        <div className="flex flex-col space-y-4">
          {/* Custom Tabs */}
          <div className="flex items-center p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--org-card-background, #1E2329)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'shadow-lg' : isDark ? 'text-white/40 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'}`}
              style={{
                backgroundColor: activeTab === 'users' ? primaryColor : 'transparent',
                color: activeTab === 'users' ? '#FFFFFF' : undefined
              }}
            >
              {t('users.title', 'Usuarios')}
              <span className={`ml-2 py-0.5 px-2 rounded-full text-[10px] ${activeTab === 'users' ? 'bg-white/20' : isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                {users.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'invitations' ? 'shadow-lg' : isDark ? 'text-white/40 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'}`}
              style={{
                backgroundColor: activeTab === 'invitations' ? primaryColor : 'transparent',
                color: activeTab === 'invitations' ? '#FFFFFF' : undefined
              }}
            >
              {t('users.tabs.invitations', 'Individuales')}
              <span className={`ml-2 py-0.5 px-2 rounded-full text-[10px] ${activeTab === 'invitations' ? 'bg-white/20' : isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                {invitations.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('links')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'links' ? 'shadow-lg' : isDark ? 'text-white/40 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'}`}
              style={{
                backgroundColor: activeTab === 'links' ? primaryColor : 'transparent',
                color: activeTab === 'links' ? '#FFFFFF' : undefined
              }}
            >
              {t('users.tabs.links', 'Enlaces')}
              <span className={`ml-2 py-0.5 px-2 rounded-full text-[10px] ${activeTab === 'links' ? 'bg-white/20' : isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                {inviteLinks.length}
              </span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative group">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-opacity ${isDark ? 'group-focus-within:opacity-70 opacity-40' : 'group-focus-within:opacity-50 opacity-30'}`} style={{ color: isDark ? '#FFFFFF' : '#0F172A' }} />
              <input
                type="text"
                placeholder={activeTab === 'users' ? t('users.placeholders.search') : t('users.placeholders.searchInvitations', 'Buscar invitaciones...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 focus:outline-none transition-all duration-300"
                style={{
                  backgroundColor: 'var(--org-card-background, #1E2329)',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  color: 'var(--org-text-color, #FFFFFF)'
                }}
              />
            </div>

          {/* Role Filter */}
          <div className="relative min-w-[140px]">
            <button
              type="button"
              onClick={() => {
                setIsRoleDropdownOpen(!isRoleDropdownOpen)
                setIsStatusDropdownOpen(false)
                setIsRegionDropdownOpen(false)
                setIsZoneDropdownOpen(false)
                setIsTeamDropdownOpen(false)
              }}
              className="w-full px-4 py-3.5 rounded-xl border-2 flex items-center justify-between gap-2 transition-all duration-300"
              style={{
                backgroundColor: 'var(--org-card-background, #1E2329)',
                borderColor: filterRole !== 'all' ? primaryColor : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                color: 'var(--org-text-color, #FFFFFF)'
              }}
            >
              <span className="text-sm truncate">
                {filterRole === 'all' ? t('users.roles.all') :
                  filterRole === 'owner' ? t('users.roles.owner') :
                    filterRole === 'admin' ? t('users.roles.admin') : t('users.roles.member')}
              </span>
              <motion.svg animate={{ rotate: isRoleDropdownOpen ? 180 : 0 }} className="w-4 h-4 opacity-50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>
            <AnimatePresence>
              {isRoleDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 rounded-xl border overflow-hidden shadow-2xl z-50"
                  style={{ backgroundColor: 'var(--org-card-background, #1E2329)', borderColor: 'rgba(255,255,255,0.15)' }}
                >
                  {[
                    { value: 'all', label: t('users.roles.all') },
                    { value: 'owner', label: t('users.roles.owner') },
                    { value: 'admin', label: t('users.roles.admin') },
                    { value: 'member', label: t('users.roles.member') }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => { setFilterRole(option.value); setIsRoleDropdownOpen(false) }}
                      className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-white/5"
                      style={{ backgroundColor: filterRole === option.value ? `${primaryColor}20` : 'transparent', color: filterRole === option.value ? (isDark ? '#FFFFFF' : primaryColor) : (isDark ? 'rgba(255,255,255,0.7)' : '#374151') }}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status Filter */}
          <div className="relative min-w-[140px]">
            <button
              type="button"
              onClick={() => {
                setIsStatusDropdownOpen(!isStatusDropdownOpen)
                setIsRoleDropdownOpen(false)
                setIsRegionDropdownOpen(false)
                setIsZoneDropdownOpen(false)
                setIsTeamDropdownOpen(false)
              }}
              className="w-full px-4 py-3.5 rounded-xl border-2 flex items-center justify-between gap-2 transition-all duration-300"
              style={{
                backgroundColor: 'var(--org-card-background, #1E2329)',
                borderColor: filterStatus !== 'all' ? accentColor : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                color: 'var(--org-text-color, #FFFFFF)'
              }}
            >
              <span className="text-sm truncate">
                {filterStatus === 'all' ? t('users.status.all') :
                  filterStatus === 'active' ? t('users.status.active') :
                    filterStatus === 'invited' ? t('users.status.invited') : t('users.status.suspended')}
              </span>
              <motion.svg animate={{ rotate: isStatusDropdownOpen ? 180 : 0 }} className="w-4 h-4 opacity-50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>
            <AnimatePresence>
              {isStatusDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 rounded-xl border overflow-hidden shadow-2xl z-50"
                  style={{ backgroundColor: 'var(--org-card-background, #1E2329)', borderColor: 'rgba(255,255,255,0.15)' }}
                >
                  {[
                    { value: 'all', label: t('users.status.all') },
                    { value: 'active', label: t('users.status.active') },
                    { value: 'invited', label: t('users.status.invited') },
                    { value: 'suspended', label: t('users.status.suspended') }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => { setFilterStatus(option.value); setIsStatusDropdownOpen(false) }}
                      className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-white/5"
                      style={{ backgroundColor: filterStatus === option.value ? `${accentColor}20` : 'transparent', color: filterStatus === option.value ? (isDark ? '#FFFFFF' : accentColor) : (isDark ? 'rgba(255,255,255,0.7)' : '#374151') }}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-3.5 rounded-xl border-2 flex items-center gap-2 transition-all duration-300 ${showAdvancedFilters ? (isDark ? 'bg-white/10' : 'bg-black/5') : ''}`}
            style={{
              backgroundColor: showAdvancedFilters ? `${primaryColor}20` : 'var(--org-card-background, #1E2329)',
              borderColor: showAdvancedFilters || activeFiltersCount > 0 ? primaryColor : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              color: 'var(--org-text-color, #FFFFFF)'
            }}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">{t('users.filters.advanced', 'Más filtros')}</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: primaryColor, color: '#FFFFFF' }}>
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border-2 overflow-hidden" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', backgroundColor: 'var(--org-card-background, #1E2329)' }}>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-3.5 transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} ${viewMode === 'cards' ? (isDark ? 'bg-white/10' : 'bg-black/5') : ''}`}
              style={{ backgroundColor: viewMode === 'cards' ? `${primaryColor}30` : 'transparent' }}
              title={t('users.view.cards', 'Vista tarjetas')}
            >
              <LayoutGrid
                className="w-5 h-5"
                style={{
                  color: viewMode === 'cards' ? primaryColor : 'rgba(255,255,255,0.7)',
                  strokeWidth: viewMode === 'cards' ? 2.5 : 2
                }}
              />
            </button>
            <div className="w-px h-6" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
            <button
              onClick={() => setViewMode('list')}
              className={`p-3.5 transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} ${viewMode === 'list' ? (isDark ? 'bg-white/10' : 'bg-black/5') : ''}`}
              style={{ backgroundColor: viewMode === 'list' ? `${primaryColor}30` : 'transparent' }}
              title={t('users.view.list', 'Vista lista')}
            >
              <List
                className="w-5 h-5"
                style={{
                  color: viewMode === 'list' ? primaryColor : isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)',
                  strokeWidth: viewMode === 'list' ? 2.5 : 2
                }}
              />
            </button>
          </div>
        </div>

        {/* Advanced Filters Row */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-3 items-center p-4 rounded-xl border border-white/10"
              style={{ backgroundColor: 'var(--org-card-background, #1E2329)' }}
            >
              {/* Region Filter */}
              {uniqueRegions.length > 0 && (
                <div className="relative min-w-[150px]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegionDropdownOpen(!isRegionDropdownOpen)
                      setIsRoleDropdownOpen(false)
                      setIsStatusDropdownOpen(false)
                      setIsZoneDropdownOpen(false)
                      setIsTeamDropdownOpen(false)
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border flex items-center justify-between gap-2 text-sm"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: filterRegion !== 'all' ? accentColor : 'rgba(255,255,255,0.1)' }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-4 h-4 opacity-60 flex-shrink-0" />
                      <span className="truncate">{filterRegion === 'all' ? t('users.filters.allRegions', 'Todas las regiones') : filterRegion}</span>
                    </div>
                  </button>
                  <AnimatePresence>
                    {isRegionDropdownOpen && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-1 rounded-lg border overflow-hidden shadow-xl z-50 max-h-48 overflow-y-auto" style={{ backgroundColor: 'var(--org-card-background, #1E2329)', borderColor: 'rgba(255,255,255,0.15)' }}>
                        <button onClick={() => { setFilterRegion('all'); setIsRegionDropdownOpen(false) }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/5" style={{ backgroundColor: filterRegion === 'all' ? `${accentColor}20` : 'transparent' }}>{t('users.filters.allRegions', 'Todas las regiones')}</button>
                        {uniqueRegions.map(region => (
                          <button key={region} onClick={() => { setFilterRegion(region || ''); setIsRegionDropdownOpen(false) }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/5" style={{ backgroundColor: filterRegion === region ? `${accentColor}20` : 'transparent' }}>{region}</button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Zone Filter */}
              {uniqueZones.length > 0 && (
                <div className="relative min-w-[150px]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsZoneDropdownOpen(!isZoneDropdownOpen)
                      setIsRoleDropdownOpen(false)
                      setIsStatusDropdownOpen(false)
                      setIsRegionDropdownOpen(false)
                      setIsTeamDropdownOpen(false)
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border flex items-center justify-between gap-2 text-sm"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: filterZone !== 'all' ? accentColor : 'rgba(255,255,255,0.1)' }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="w-4 h-4 opacity-60 flex-shrink-0" />
                      <span className="truncate">{filterZone === 'all' ? t('users.filters.allZones', 'Todas las zonas') : filterZone}</span>
                    </div>
                  </button>
                  <AnimatePresence>
                    {isZoneDropdownOpen && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-1 rounded-lg border overflow-hidden shadow-xl z-50 max-h-48 overflow-y-auto" style={{ backgroundColor: 'var(--org-card-background, #1E2329)', borderColor: 'rgba(255,255,255,0.15)' }}>
                        <button onClick={() => { setFilterZone('all'); setIsZoneDropdownOpen(false) }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/5" style={{ backgroundColor: filterZone === 'all' ? `${accentColor}20` : 'transparent' }}>{t('users.filters.allZones', 'Todas las zonas')}</button>
                        {uniqueZones.map(zone => (
                          <button key={zone} onClick={() => { setFilterZone(zone || ''); setIsZoneDropdownOpen(false) }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/5" style={{ backgroundColor: filterZone === zone ? `${accentColor}20` : 'transparent' }}>{zone}</button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Team Filter */}
              {uniqueTeams.length > 0 && (
                <div className="relative min-w-[150px]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTeamDropdownOpen(!isTeamDropdownOpen)
                      setIsRoleDropdownOpen(false)
                      setIsStatusDropdownOpen(false)
                      setIsRegionDropdownOpen(false)
                      setIsZoneDropdownOpen(false)
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border flex items-center justify-between gap-2 text-sm"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: filterTeam !== 'all' ? accentColor : 'rgba(255,255,255,0.1)' }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Network className="w-4 h-4 opacity-60 flex-shrink-0" />
                      <span className="truncate">{filterTeam === 'all' ? t('users.filters.allTeams', 'Todos los equipos') : filterTeam}</span>
                    </div>
                  </button>
                  <AnimatePresence>
                    {isTeamDropdownOpen && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-1 rounded-lg border overflow-hidden shadow-xl z-50 max-h-48 overflow-y-auto" style={{ backgroundColor: 'var(--org-card-background, #1E2329)', borderColor: 'rgba(255,255,255,0.15)' }}>
                        <button onClick={() => { setFilterTeam('all'); setIsTeamDropdownOpen(false) }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/5" style={{ backgroundColor: filterTeam === 'all' ? `${accentColor}20` : 'transparent' }}>{t('users.filters.allTeams', 'Todos los equipos')}</button>
                        {uniqueTeams.map(team => (
                          <button key={team} onClick={() => { setFilterTeam(team || ''); setIsTeamDropdownOpen(false) }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/5" style={{ backgroundColor: filterTeam === team ? `${accentColor}20` : 'transparent' }}>{team}</button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                  {t('users.filters.clear', 'Limpiar filtros')}
                </button>
              )}

              {/* Results Count */}
              <div className="ml-auto text-sm opacity-60">
                {filteredUsers.length} {t('users.filters.results', 'resultados')}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content Grid/List or Empty State */}
      <AnimatePresence mode="wait">
        {activeTab === 'users' ? (
          filteredUsers.length === 0 ? (
            <EmptyState
              key="empty-users"
              onAddClick={() => setIsAddModalOpen(true)}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          ) : viewMode === 'cards' ? (
            <motion.div
              key="grid-users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6"
            >
              {filteredUsers.map((user, index) => (
                <UserCard
                  key={user.id}
                  user={user}
                  index={index}
                  primaryColor={primaryColor}
                  onEdit={() => { setEditingUser(user); setIsEditModalOpen(true) }}
                  onDelete={() => { setDeletingUser(user); setIsDeleteModalOpen(true) }}
                  onStats={() => { setStatsUser(user); setIsStatsModalOpen(true) }}
                  onResend={user.org_status === 'invited' ? () => resendInvitation(user.id) : undefined}
                  onSuspend={user.org_status === 'active' ? () => suspendUser(user.id) : undefined}
                  onActivate={user.org_status === 'suspended' ? () => activateUser(user.id) : undefined}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list-users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {/* List Header */}
              <div className="hidden lg:grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium opacity-50 uppercase tracking-wider">
                <div className="col-span-2">{t('users.list.name', 'Nombre')}</div>
                <div>{t('users.list.hierarchy', 'Ubicación')}</div>
                <div>{t('users.list.role', 'Rol / Estado')}</div>
                <div className="text-right">{t('users.list.lastAccess', 'Último acceso')}</div>
              </div>
              {filteredUsers.map((user, index) => (
                <UserListRow
                  key={user.id}
                  user={user}
                  index={index}
                  primaryColor={primaryColor}
                  onEdit={() => { setEditingUser(user); setIsEditModalOpen(true) }}
                  onDelete={() => { setDeletingUser(user); setIsDeleteModalOpen(true) }}
                  onStats={() => { setStatsUser(user); setIsStatsModalOpen(true) }}
                  onResend={user.org_status === 'invited' ? () => resendInvitation(user.id) : undefined}
                  onSuspend={user.org_status === 'active' ? () => suspendUser(user.id) : undefined}
                  onActivate={user.org_status === 'suspended' ? () => activateUser(user.id) : undefined}
                />
              ))}
            </motion.div>
          )
        ) : activeTab === 'invitations' ? (
          /* Invitations Tab Content */
          filteredInvitations.length === 0 ? (
            <div key="empty-invitations" className="flex flex-col items-center justify-center p-20 text-center rounded-3xl border border-white/5 bg-white/5">
              <Mail className="w-16 h-16 opacity-20 mb-4" />
              <h3 className="text-xl font-bold opacity-60">No hay invitaciones pendientes</h3>
              <p className="text-sm opacity-40 max-w-xs mx-auto mt-2">
                Todas tus invitaciones han sido aceptadas o no has enviado ninguna recientemente.
              </p>
            </div>
          ) : viewMode === 'cards' ? (
            <motion.div
              key="grid-invitations"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredInvitations.map((inv, index) => (
                <InvitationCard
                  key={inv.id}
                  invitation={inv}
                  index={index}
                  primaryColor={primaryColor}
                  onResend={() => handleResendIndividualInvitation(inv.id)}
                  onRevoke={() => handleRevokeInvitation(inv.id)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list-invitations"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {/* List Header */}
              <div className="hidden lg:grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium opacity-50 uppercase tracking-wider">
                <div className="col-span-2">{t('users.list.invitation', 'Invitación')}</div>
                <div>{t('users.list.sent', 'Enviada')}</div>
                <div>{t('users.list.status', 'Estado')}</div>
                <div className="text-right">Acciones</div>
              </div>
              {filteredInvitations.map((inv, index) => (
                <InvitationListRow
                  key={inv.id}
                  invitation={inv}
                  index={index}
                  primaryColor={primaryColor}
                  onResend={() => handleResendIndividualInvitation(inv.id)}
                  onRevoke={() => handleRevokeInvitation(inv.id)}
                />
              ))}
            </motion.div>
          )
        ) : (
          /* Invite Links Tab Content */
          inviteLinks.length === 0 ? (
            <div key="empty-links" className="flex flex-col items-center justify-center p-20 text-center rounded-3xl border border-white/5 bg-white/5">
              <Link2 className="w-16 h-16 opacity-20 mb-4" />
              <h3 className="text-xl font-bold opacity-60">No hay enlaces activos</h3>
              <p className="text-sm opacity-40 max-w-xs mx-auto mt-2">
                Crea enlaces de invitación masiva para compartir con grupos grandes.
              </p>
            </div>
          ) : viewMode === 'cards' ? (
            <motion.div
              key="grid-links"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {inviteLinks.map((link, index) => (
                <InviteLinkCard
                  key={link.id}
                  link={link}
                  index={index}
                  primaryColor={primaryColor}
                  onToggleStatus={() => updateInviteLinkStatus(link.id, link.status === 'active' ? 'pause' : 'resume')}
                  onDelete={() => deleteInviteLink(link.id)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list-links"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {/* List Header */}
              <div className="hidden lg:grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium opacity-50 uppercase tracking-wider">
                <div className="col-span-1 lg:col-span-1">{t('users.list.link', 'Enlace')}</div>
                <div>{t('users.list.usage', 'Uso / Disponibles')}</div>
                <div>{t('users.list.expires', 'Vencimiento')}</div>
                <div className="text-right">Acciones</div>
              </div>
              {inviteLinks.map((link, index) => (
                <InviteLinkRow
                  key={link.id}
                  link={link}
                  index={index}
                  primaryColor={primaryColor}
                  onToggleStatus={() => updateInviteLinkStatus(link.id, link.status === 'active' ? 'pause' : 'resume')}
                  onDelete={() => deleteInviteLink(link.id)}
                />
              ))}
            </motion.div>
          )
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSaveNewUser} />
      <EditUserModal user={editingUser} isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingUser(null) }} onSave={async (id, data) => { await updateUser(id, data) }} />
      <DeleteUserModal user={deletingUser} isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setDeletingUser(null) }} onConfirm={async () => { if (deletingUser) await deleteUser(deletingUser.id) }} />
      <ImportUsersModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImportComplete={() => { refetch(); setIsImportModalOpen(false) }} />
      {statsUser && <UserStatsModal user={statsUser} isOpen={isStatsModalOpen} onClose={() => { setIsStatsModalOpen(false); setStatsUser(null) }} />}
      <UnifiedInviteModal
        isOpen={isUnifiedInviteModalOpen}
        onClose={() => setIsUnifiedInviteModalOpen(false)}
        onInviteSent={() => refetch()}
        onLinkCreated={() => refetch()}
        organizationId={orgData?.id || undefined}
        organizationSlug={orgSlug}
      />

      {/* Toast Notifications */}
      <ToastNotification
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        message={toast.message}
        type={toast.type}
      />
    </div>
  )
}

