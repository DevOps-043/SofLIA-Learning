'use client'

import type { Dispatch, SetStateAction } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Building2,
  Filter,
  LayoutGrid,
  List,
  MapPin,
  Network,
  X,
} from 'lucide-react'
import type { TFunction } from 'i18next'
import type {
  BulkInviteLink,
  BusinessInvitation,
  BusinessUser,
} from '@/features/business-panel/services/businessUsers.service'
import type { JoinRequest } from '@/features/business-panel/services/joinRequests.service'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { BusinessPanelSearchInput } from '@/features/business-panel/components/shared/BusinessPanelSearchInput'

type UserManagementTab = 'users' | 'invitations' | 'links' | 'requests'
type UserManagementViewMode = 'cards' | 'list'

interface UsersFilterBarProps {
  activeTab: UserManagementTab
  setActiveTab: Dispatch<SetStateAction<UserManagementTab>>
  users: BusinessUser[]
  invitations: BusinessInvitation[]
  inviteLinks: BulkInviteLink[]
  joinRequests: JoinRequest[]
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
  viewMode: UserManagementViewMode
  setViewMode: Dispatch<SetStateAction<UserManagementViewMode>>
  uniqueRegions: (string | null | undefined)[]
  filterRegion: string
  setFilterRegion: (v: string) => void
  isRegionDropdownOpen: boolean
  setIsRegionDropdownOpen: (v: boolean) => void
  uniqueZones: (string | null | undefined)[]
  filterZone: string
  setFilterZone: (v: string) => void
  isZoneDropdownOpen: boolean
  setIsZoneDropdownOpen: (v: boolean) => void
  uniqueTeams: (string | null | undefined)[]
  filterTeam: string
  setFilterTeam: (v: string) => void
  isTeamDropdownOpen: boolean
  setIsTeamDropdownOpen: (v: boolean) => void
  filteredUsers: BusinessUser[]
  filteredInvitations: BusinessInvitation[]
  filteredInviteLinks: BulkInviteLink[]
  filteredJoinRequests: JoinRequest[]
  t: TFunction
}

export function UsersFilterBar({
  activeTab,
  setActiveTab,
  users,
  invitations,
  inviteLinks,
  joinRequests,
  searchTerm,
  setSearchTerm,
  filterRole,
  setFilterRole,
  isRoleDropdownOpen,
  setIsRoleDropdownOpen,
  filterStatus,
  setFilterStatus,
  isStatusDropdownOpen,
  setIsStatusDropdownOpen,
  showAdvancedFilters,
  setShowAdvancedFilters,
  activeFiltersCount,
  clearAllFilters,
  viewMode,
  setViewMode,
  uniqueRegions,
  filterRegion,
  setFilterRegion,
  isRegionDropdownOpen,
  setIsRegionDropdownOpen,
  uniqueZones,
  filterZone,
  setFilterZone,
  isZoneDropdownOpen,
  setIsZoneDropdownOpen,
  uniqueTeams,
  filterTeam,
  setFilterTeam,
  isTeamDropdownOpen,
  setIsTeamDropdownOpen,
  filteredUsers,
  filteredInvitations,
  filteredInviteLinks,
  filteredJoinRequests,
  t,
}: UsersFilterBarProps) {
  const {
    primaryColor,
    onPrimaryColor,
    accentColor,
    isDark,
    cardBg,
    borderColor,
    hoverBg,
    textColor,
    mutedTextColor,
    dividerColor,
  } = useBusinessPanelTheme()

  const isUsersTab = activeTab === 'users'
  const tabs: Array<{ key: UserManagementTab; label: string; count: number }> = [
    { key: 'users', label: t('users.title', 'Usuarios'), count: users.length },
    {
      key: 'invitations',
      label: t('users.tabs.invitations', 'Individuales'),
      count: invitations.length,
    },
    { key: 'links', label: t('users.tabs.links', 'Enlaces'), count: inviteLinks.length },
    {
      key: 'requests',
      label: t('sidebar.joinRequests', 'Solicitudes'),
      count: joinRequests.length,
    },
  ]
  const resultsCount =
    activeTab === 'users'
      ? filteredUsers.length
      : activeTab === 'invitations'
        ? filteredInvitations.length
        : activeTab === 'links'
          ? filteredInviteLinks.length
          : filteredJoinRequests.length

  const closeAllDropdowns = () => {
    setIsRoleDropdownOpen(false)
    setIsStatusDropdownOpen(false)
    setIsRegionDropdownOpen(false)
    setIsZoneDropdownOpen(false)
    setIsTeamDropdownOpen(false)
  }

  return (
    <div className="flex flex-col space-y-4">
      <div
        className="flex items-center p-1 rounded-xl overflow-x-auto scrollbar-hide max-w-full"
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === key
                ? 'shadow-lg'
                : isDark
                  ? 'text-white/40 hover:text-white/60'
                  : 'text-gray-400 hover:text-gray-600'
            }`}
            style={{
              backgroundColor: activeTab === key ? primaryColor : 'transparent',
              color: activeTab === key ? onPrimaryColor : undefined,
            }}
          >
            {label}
            <span
              className={`ml-1.5 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full text-[10px] ${
                activeTab === key ? 'bg-white/20' : isDark ? 'bg-white/10' : 'bg-black/5'
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <BusinessPanelSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={
            activeTab === 'users'
              ? t('users.placeholders.search')
              : activeTab === 'requests'
                ? t('users.placeholders.searchRequests', 'Buscar solicitudes...')
                : activeTab === 'links'
                  ? t('users.placeholders.searchLinks', 'Buscar enlaces...')
                  : t('users.placeholders.searchInvitations', 'Buscar invitaciones...')
          }
          className="flex-1"
        />

        {isUsersTab && (
          <>
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
                  backgroundColor: cardBg,
                  borderColor: filterRole !== 'all' ? primaryColor : borderColor,
                  color: textColor,
                }}
              >
                <span className="text-sm truncate">
                  {filterRole === 'all'
                    ? t('users.roles.all')
                    : filterRole === 'owner'
                      ? t('users.roles.owner')
                      : filterRole === 'admin'
                        ? t('users.roles.admin')
                        : t('users.roles.member')}
                </span>
                <motion.svg
                  animate={{ rotate: isRoleDropdownOpen ? 180 : 0 }}
                  className="w-4 h-4 opacity-50 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
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
                    style={{ backgroundColor: cardBg, borderColor }}
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
                        onClick={() => {
                          setFilterRole(option.value)
                          setIsRoleDropdownOpen(false)
                        }}
                        className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{
                          backgroundColor:
                            filterRole === option.value ? `${primaryColor}20` : 'transparent',
                          color:
                            filterRole === option.value
                              ? isDark
                                ? textColor
                                : primaryColor
                              : mutedTextColor,
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
                  backgroundColor: cardBg,
                  borderColor: filterStatus !== 'all' ? accentColor : borderColor,
                  color: textColor,
                }}
              >
                <span className="text-sm truncate">
                  {filterStatus === 'all'
                    ? t('users.status.all')
                    : filterStatus === 'active'
                      ? t('users.status.active')
                      : filterStatus === 'invited'
                        ? t('users.status.invited')
                        : t('users.status.suspended')}
                </span>
                <motion.svg
                  animate={{ rotate: isStatusDropdownOpen ? 180 : 0 }}
                  className="w-4 h-4 opacity-50 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
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
                    style={{ backgroundColor: cardBg, borderColor }}
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
                        onClick={() => {
                          setFilterStatus(option.value)
                          setIsStatusDropdownOpen(false)
                        }}
                        className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{
                          backgroundColor:
                            filterStatus === option.value ? `${accentColor}20` : 'transparent',
                          color:
                            filterStatus === option.value
                              ? isDark
                                ? textColor
                                : accentColor
                              : mutedTextColor,
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-4 py-3.5 rounded-xl border-2 flex items-center gap-2 transition-all duration-300"
              style={{
                backgroundColor: showAdvancedFilters ? `${primaryColor}20` : cardBg,
                borderColor:
                  showAdvancedFilters || activeFiltersCount > 0 ? primaryColor : borderColor,
                color: textColor,
              }}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">
                {t('users.filters.advanced', 'Más filtros')}
              </span>
              {activeFiltersCount > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ backgroundColor: primaryColor, color: onPrimaryColor }}
                >
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </>
        )}

        <div
          className="flex items-center rounded-xl border-2 overflow-hidden"
          style={{ borderColor, backgroundColor: cardBg }}
        >
          <button
            onClick={() => setViewMode('cards')}
            className="p-3.5 transition-all"
            style={{ backgroundColor: viewMode === 'cards' ? `${primaryColor}30` : 'transparent' }}
            title={t('users.view.cards', 'Vista tarjetas')}
          >
            <LayoutGrid
              className="w-5 h-5"
              style={{
                color: viewMode === 'cards' ? primaryColor : mutedTextColor,
                strokeWidth: viewMode === 'cards' ? 2.5 : 2,
              }}
            />
          </button>
          <div className="w-px h-6" style={{ backgroundColor: dividerColor }} />
          <button
            onClick={() => setViewMode('list')}
            className="p-3.5 transition-all"
            style={{ backgroundColor: viewMode === 'list' ? `${primaryColor}30` : 'transparent' }}
            title={t('users.view.list', 'Vista lista')}
          >
            <List
              className="w-5 h-5"
              style={{
                color: viewMode === 'list' ? primaryColor : mutedTextColor,
                strokeWidth: viewMode === 'list' ? 2.5 : 2,
              }}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isUsersTab && showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-3 items-center p-4 rounded-xl border"
            style={{ backgroundColor: cardBg, borderColor }}
          >
            {uniqueRegions.length > 0 && (
              <div className="relative min-w-[150px]">
                <button
                  type="button"
                  onClick={() => {
                    closeAllDropdowns()
                    setIsRegionDropdownOpen(!isRegionDropdownOpen)
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border flex items-center justify-between gap-2 text-sm"
                  style={{
                    backgroundColor: hoverBg,
                    borderColor: filterRegion !== 'all' ? accentColor : borderColor,
                    color: textColor,
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-4 h-4 opacity-60 flex-shrink-0" />
                    <span className="truncate">
                      {filterRegion === 'all'
                        ? t('users.filters.allRegions', 'Todas las regiones')
                        : filterRegion}
                    </span>
                  </div>
                </button>
                <AnimatePresence>
                  {isRegionDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-1 rounded-lg border overflow-hidden shadow-xl z-50 max-h-48 overflow-y-auto"
                      style={{ backgroundColor: cardBg, borderColor }}
                    >
                      <button
                        onClick={() => {
                          setFilterRegion('all')
                          setIsRegionDropdownOpen(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm"
                        style={{
                          backgroundColor:
                            filterRegion === 'all' ? `${accentColor}20` : 'transparent',
                          color: textColor,
                        }}
                      >
                        {t('users.filters.allRegions', 'Todas las regiones')}
                      </button>
                      {uniqueRegions.map((region) => (
                        <button
                          key={region}
                          onClick={() => {
                            setFilterRegion(region || '')
                            setIsRegionDropdownOpen(false)
                          }}
                          className="w-full px-3 py-2 text-left text-sm"
                          style={{
                            backgroundColor:
                              filterRegion === region ? `${accentColor}20` : 'transparent',
                            color: textColor,
                          }}
                        >
                          {region}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {uniqueZones.length > 0 && (
              <div className="relative min-w-[150px]">
                <button
                  type="button"
                  onClick={() => {
                    closeAllDropdowns()
                    setIsZoneDropdownOpen(!isZoneDropdownOpen)
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border flex items-center justify-between gap-2 text-sm"
                  style={{
                    backgroundColor: hoverBg,
                    borderColor: filterZone !== 'all' ? accentColor : borderColor,
                    color: textColor,
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="w-4 h-4 opacity-60 flex-shrink-0" />
                    <span className="truncate">
                      {filterZone === 'all'
                        ? t('users.filters.allZones', 'Todas las zonas')
                        : filterZone}
                    </span>
                  </div>
                </button>
                <AnimatePresence>
                  {isZoneDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-1 rounded-lg border overflow-hidden shadow-xl z-50 max-h-48 overflow-y-auto"
                      style={{ backgroundColor: cardBg, borderColor }}
                    >
                      <button
                        onClick={() => {
                          setFilterZone('all')
                          setIsZoneDropdownOpen(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm"
                        style={{
                          backgroundColor:
                            filterZone === 'all' ? `${accentColor}20` : 'transparent',
                          color: textColor,
                        }}
                      >
                        {t('users.filters.allZones', 'Todas las zonas')}
                      </button>
                      {uniqueZones.map((zone) => (
                        <button
                          key={zone}
                          onClick={() => {
                            setFilterZone(zone || '')
                            setIsZoneDropdownOpen(false)
                          }}
                          className="w-full px-3 py-2 text-left text-sm"
                          style={{
                            backgroundColor:
                              filterZone === zone ? `${accentColor}20` : 'transparent',
                            color: textColor,
                          }}
                        >
                          {zone}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {uniqueTeams.length > 0 && (
              <div className="relative min-w-[150px]">
                <button
                  type="button"
                  onClick={() => {
                    closeAllDropdowns()
                    setIsTeamDropdownOpen(!isTeamDropdownOpen)
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border flex items-center justify-between gap-2 text-sm"
                  style={{
                    backgroundColor: hoverBg,
                    borderColor: filterTeam !== 'all' ? accentColor : borderColor,
                    color: textColor,
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Network className="w-4 h-4 opacity-60 flex-shrink-0" />
                    <span className="truncate">
                      {filterTeam === 'all'
                        ? t('users.filters.allTeams', 'Todos los equipos')
                        : filterTeam}
                    </span>
                  </div>
                </button>
                <AnimatePresence>
                  {isTeamDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-1 rounded-lg border overflow-hidden shadow-xl z-50 max-h-48 overflow-y-auto"
                      style={{ backgroundColor: cardBg, borderColor }}
                    >
                      <button
                        onClick={() => {
                          setFilterTeam('all')
                          setIsTeamDropdownOpen(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm"
                        style={{
                          backgroundColor:
                            filterTeam === 'all' ? `${accentColor}20` : 'transparent',
                          color: textColor,
                        }}
                      >
                        {t('users.filters.allTeams', 'Todos los equipos')}
                      </button>
                      {uniqueTeams.map((team) => (
                        <button
                          key={team}
                          onClick={() => {
                            setFilterTeam(team || '')
                            setIsTeamDropdownOpen(false)
                          }}
                          className="w-full px-3 py-2 text-left text-sm"
                          style={{
                            backgroundColor:
                              filterTeam === team ? `${accentColor}20` : 'transparent',
                            color: textColor,
                          }}
                        >
                          {team}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <X className="w-4 h-4" />
                {t('users.filters.clear', 'Limpiar filtros')}
              </button>
            )}

            <div className="ml-auto text-sm opacity-60">
              {resultsCount} {t('users.filters.results', 'resultados')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
