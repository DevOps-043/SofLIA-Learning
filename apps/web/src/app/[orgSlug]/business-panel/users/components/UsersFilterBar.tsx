'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, X, LayoutGrid, List, MapPin, Building2, Network,
} from 'lucide-react'
import type { TFunction } from 'i18next'
import type { BusinessUser, BusinessInvitation, BulkInviteLink } from '@/features/business-panel/services/businessUsers.service'

interface UsersFilterBarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  users: BusinessUser[]
  invitations: BusinessInvitation[]
  inviteLinks: BulkInviteLink[]
  searchTerm: string
  setSearchTerm: (v: string) => void
  filterRole: string
  setFilterRole: (v: string) => void
  isRoleDropdownOpen: boolean
  setIsRoleDropdownOpen: (v: boolean) => void
  filterStatus: string
  setFilterStatus: (v: string) => void
  isStatusDropdownOpen: boolean
  setIsStatusDropdownOpen: (v: boolean) => void
  showAdvancedFilters: boolean
  setShowAdvancedFilters: (v: boolean) => void
  activeFiltersCount: number
  clearAllFilters: () => void
  viewMode: string
  setViewMode: (v: string) => void
  uniqueRegions: (string | null)[]
  filterRegion: string
  setFilterRegion: (v: string) => void
  isRegionDropdownOpen: boolean
  setIsRegionDropdownOpen: (v: boolean) => void
  uniqueZones: (string | null)[]
  filterZone: string
  setFilterZone: (v: string) => void
  isZoneDropdownOpen: boolean
  setIsZoneDropdownOpen: (v: boolean) => void
  uniqueTeams: (string | null)[]
  filterTeam: string
  setFilterTeam: (v: string) => void
  isTeamDropdownOpen: boolean
  setIsTeamDropdownOpen: (v: boolean) => void
  filteredUsers: BusinessUser[]
  primaryColor: string
  accentColor: string
  isDark: boolean
  t: TFunction
}

export function UsersFilterBar({
  activeTab, setActiveTab,
  users, invitations, inviteLinks,
  searchTerm, setSearchTerm,
  filterRole, setFilterRole, isRoleDropdownOpen, setIsRoleDropdownOpen,
  filterStatus, setFilterStatus, isStatusDropdownOpen, setIsStatusDropdownOpen,
  showAdvancedFilters, setShowAdvancedFilters, activeFiltersCount, clearAllFilters,
  viewMode, setViewMode,
  uniqueRegions, filterRegion, setFilterRegion, isRegionDropdownOpen, setIsRegionDropdownOpen,
  uniqueZones, filterZone, setFilterZone, isZoneDropdownOpen, setIsZoneDropdownOpen,
  uniqueTeams, filterTeam, setFilterTeam, isTeamDropdownOpen, setIsTeamDropdownOpen,
  filteredUsers,
  primaryColor, accentColor, isDark, t,
}: UsersFilterBarProps) {
  const closeAllDropdowns = () => {
    setIsRoleDropdownOpen(false)
    setIsStatusDropdownOpen(false)
    setIsRegionDropdownOpen(false)
    setIsZoneDropdownOpen(false)
    setIsTeamDropdownOpen(false)
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Tabs */}
      <div
        className="flex items-center p-1 rounded-xl w-fit"
        style={{
          backgroundColor: 'var(--org-card-background, #1E2329)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
        }}
      >
        {[
          { key: 'users', label: t('users.title', 'Usuarios'), count: users.length },
          { key: 'invitations', label: t('users.tabs.invitations', 'Individuales'), count: invitations.length },
          { key: 'links', label: t('users.tabs.links', 'Enlaces'), count: inviteLinks.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === key ? 'shadow-lg' : isDark ? 'text-white/40 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'}`}
            style={{
              backgroundColor: activeTab === key ? primaryColor : 'transparent',
              color: activeTab === key ? (isDark ? '#000000' : '#FFFFFF') : undefined,
            }}
          >
            {label}
            <span className={`ml-2 py-0.5 px-2 rounded-full text-[10px] ${activeTab === key ? 'bg-white/20' : isDark ? 'bg-white/10' : 'bg-black/5'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative group">
          <Search
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-opacity ${isDark ? 'group-focus-within:opacity-70 opacity-40' : 'group-focus-within:opacity-50 opacity-30'}`}
            style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}
          />
          <input
            type="text"
            placeholder={
              activeTab === 'users'
                ? t('users.placeholders.search')
                : t('users.placeholders.searchInvitations', 'Buscar invitaciones...')
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 focus:outline-none transition-all duration-300"
            style={{
              backgroundColor: 'var(--org-card-background, #1E2329)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              color: 'var(--org-text-color, #FFFFFF)',
            }}
          />
        </div>

        {/* Role Filter */}
        <div className="relative min-w-[140px]">
          <button
            type="button"
            onClick={() => { setIsRoleDropdownOpen(!isRoleDropdownOpen); setIsStatusDropdownOpen(false); setIsRegionDropdownOpen(false); setIsZoneDropdownOpen(false); setIsTeamDropdownOpen(false) }}
            className="w-full px-4 py-3.5 rounded-xl border-2 flex items-center justify-between gap-2 transition-all duration-300"
            style={{
              backgroundColor: 'var(--org-card-background, #1E2329)',
              borderColor: filterRole !== 'all' ? primaryColor : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              color: 'var(--org-text-color, #FFFFFF)',
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
                  { value: 'member', label: t('users.roles.member') },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => { setFilterRole(option.value); setIsRoleDropdownOpen(false) }}
                    className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-white/5"
                    style={{
                      backgroundColor: filterRole === option.value ? `${primaryColor}20` : 'transparent',
                      color: filterRole === option.value ? (isDark ? '#FFFFFF' : primaryColor) : (isDark ? 'rgba(255,255,255,0.7)' : '#374151'),
                    }}
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
            onClick={() => { setIsStatusDropdownOpen(!isStatusDropdownOpen); setIsRoleDropdownOpen(false); setIsRegionDropdownOpen(false); setIsZoneDropdownOpen(false); setIsTeamDropdownOpen(false) }}
            className="w-full px-4 py-3.5 rounded-xl border-2 flex items-center justify-between gap-2 transition-all duration-300"
            style={{
              backgroundColor: 'var(--org-card-background, #1E2329)',
              borderColor: filterStatus !== 'all' ? accentColor : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              color: 'var(--org-text-color, #FFFFFF)',
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
                  { value: 'suspended', label: t('users.status.suspended') },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => { setFilterStatus(option.value); setIsStatusDropdownOpen(false) }}
                    className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-white/5"
                    style={{
                      backgroundColor: filterStatus === option.value ? `${accentColor}20` : 'transparent',
                      color: filterStatus === option.value ? (isDark ? '#FFFFFF' : accentColor) : (isDark ? 'rgba(255,255,255,0.7)' : '#374151'),
                    }}
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
            color: 'var(--org-text-color, #FFFFFF)',
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
        <div
          className="flex items-center rounded-xl border-2 overflow-hidden"
          style={{
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            backgroundColor: 'var(--org-card-background, #1E2329)',
          }}
        >
          <button
            onClick={() => setViewMode('cards')}
            className={`p-3.5 transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
            style={{ backgroundColor: viewMode === 'cards' ? `${primaryColor}30` : 'transparent' }}
            title={t('users.view.cards', 'Vista tarjetas')}
          >
            <LayoutGrid
              className="w-5 h-5"
              style={{
                color: viewMode === 'cards' ? primaryColor : 'rgba(255,255,255,0.7)',
                strokeWidth: viewMode === 'cards' ? 2.5 : 2,
              }}
            />
          </button>
          <div className="w-px h-6" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
          <button
            onClick={() => setViewMode('list')}
            className={`p-3.5 transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
            style={{ backgroundColor: viewMode === 'list' ? `${primaryColor}30` : 'transparent' }}
            title={t('users.view.list', 'Vista lista')}
          >
            <List
              className="w-5 h-5"
              style={{
                color: viewMode === 'list' ? primaryColor : isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)',
                strokeWidth: viewMode === 'list' ? 2.5 : 2,
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
                  onClick={() => { setIsRegionDropdownOpen(!isRegionDropdownOpen); closeAllDropdowns(); setIsRegionDropdownOpen(!isRegionDropdownOpen) }}
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
                  onClick={() => { setIsZoneDropdownOpen(!isZoneDropdownOpen); closeAllDropdowns(); setIsZoneDropdownOpen(!isZoneDropdownOpen) }}
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
                  onClick={() => { setIsTeamDropdownOpen(!isTeamDropdownOpen); closeAllDropdowns(); setIsTeamDropdownOpen(!isTeamDropdownOpen) }}
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
  )
}
