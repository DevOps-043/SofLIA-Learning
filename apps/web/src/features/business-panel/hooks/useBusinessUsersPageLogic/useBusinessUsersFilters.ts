import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'

export function useBusinessUsersFilters() {
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRegion, setFilterRegion] = useState('all')
  const [filterZone, setFilterZone] = useState('all')
  const [filterTeam, setFilterTeam] = useState('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false)
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false)
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false)
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 250)
  const normalizedSearchTerm = useMemo(
    () => debouncedSearchTerm.trim().toLowerCase(),
    [debouncedSearchTerm],
  )
  const activeFiltersCount = useMemo(
    () => [filterRole, filterStatus, filterRegion, filterZone, filterTeam].filter((filter) => filter !== 'all').length,
    [filterRegion, filterRole, filterStatus, filterTeam, filterZone],
  )
  const clearAllFilters = useCallback(() => {
    setFilterRole('all'); setFilterStatus('all'); setFilterRegion('all')
    setFilterZone('all'); setFilterTeam('all'); setSearchTerm('')
  }, [])

  return {
    viewMode, setViewMode, searchTerm, setSearchTerm, filterRole, setFilterRole,
    filterStatus, setFilterStatus, filterRegion, setFilterRegion, filterZone,
    setFilterZone, filterTeam, setFilterTeam, showAdvancedFilters,
    setShowAdvancedFilters, debouncedSearchTerm, normalizedSearchTerm,
    activeFiltersCount, clearAllFilters, isRoleDropdownOpen, setIsRoleDropdownOpen,
    isStatusDropdownOpen, setIsStatusDropdownOpen, isRegionDropdownOpen,
    setIsRegionDropdownOpen, isZoneDropdownOpen, setIsZoneDropdownOpen,
    isTeamDropdownOpen, setIsTeamDropdownOpen,
  }
}
