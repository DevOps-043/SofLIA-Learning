'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useThemeStore } from '@/core/stores/themeStore'
import { useBusinessUsers } from '../../hooks/useBusinessUsers'
import { useOrganizationStylesContext } from '../../contexts/OrganizationStylesContext'
import { HierarchyService } from '../../services/hierarchy.service'
import type { TeamMembersModalProps } from './types'

export function useTeamMembersModalLogic({
  currentMembers,
  isOpen,
  onMembersUpdated,
  teamId,
}: Pick<TeamMembersModalProps, 'currentMembers' | 'isOpen' | 'onMembersUpdated' | 'teamId'>) {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const panelStyles = useOrganizationStylesContext().styles?.panel
  const { users, isLoading: loadingUsers, syncOrgData: refetchUsers } = useBusinessUsers(orgSlug)
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [isAssigning, setIsAssigning] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const theme = {
    primaryColor: panelStyles?.primary_button_color || (isDark ? '#8B5CF6' : '#6366F1'),
    accentColor: panelStyles?.accent_color || '#10B981',
    cardBackground: isDark ? (panelStyles?.card_background || '#1E2329') : '#FFFFFF',
  }

  useEffect(() => {
    if (!isOpen) return
    refetchUsers(); setSearchTerm(''); setSelectedUserIds(new Set())
    setError(null); setSuccess(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const currentMemberIds = useMemo(
    () => new Set(currentMembers.map((member) => member.user_id || member.user?.id)),
    [currentMembers],
  )
  const availableUsers = useMemo(() => users.filter((user) => {
    const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    const matchesSearch = searchTerm === '' ||
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch &&
      !currentMemberIds.has(user.id) &&
      (user.org_status === 'active' || !user.org_status) &&
      user.role !== 'owner'
  }), [currentMemberIds, searchTerm, users])

  const toggleUser = (userId: string) => {
    setSelectedUserIds((previous) => {
      const next = new Set(previous)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }
  const handleSelectAll = () => {
    const ids = availableUsers.map((user) => user.id)
    if (ids.length === 0) return
    setSelectedUserIds(ids.every((id) => selectedUserIds.has(id)) ? new Set() : new Set(ids))
  }
  const handleAddMembers = async () => {
    if (selectedUserIds.size === 0) { setError('Selecciona al menos un usuario para agregar'); return }
    setIsAssigning(true); setError(null); setSuccess(null)
    try {
      const results = await Promise.all(Array.from(selectedUserIds).map((userId) =>
        HierarchyService.assignUserToTeam({ user_id: userId, team_id: teamId, role: 'member' }, orgSlug)
      ))
      const failed = results.filter((result) => !result.success)
      if (failed.length > 0) setError(`Error al agregar ${failed.length} usuario(s): ${failed[0].error}`)
      else { setSuccess(`${selectedUserIds.size} usuario(s) agregado(s) exitosamente`); setSelectedUserIds(new Set()); onMembersUpdated(); refetchUsers() }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar miembros')
    } finally {
      setIsAssigning(false)
    }
  }
  const handleRemoveMember = async (userId: string) => {
    setIsRemoving(userId); setError(null); setSuccess(null)
    try {
      const result = await HierarchyService.removeUserFromTeam(userId, orgSlug)
      if (result.success) { setSuccess('Miembro removido exitosamente'); onMembersUpdated(); refetchUsers() }
      else setError(result.error || 'Error al remover miembro')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al remover miembro')
    } finally {
      setIsRemoving(null)
    }
  }
  const handleChangeRole = async (userId: string, role: 'team_leader' | 'member') => {
    setError(null); setSuccess(null)
    const result = await HierarchyService.assignUserToTeam({ user_id: userId, team_id: teamId, role }, orgSlug)
    if (result.success) { setSuccess('Rol actualizado exitosamente'); onMembersUpdated() }
    else setError(result.error || 'Error al actualizar rol')
  }

  return {
    availableUsers, error, handleAddMembers, handleChangeRole, handleRemoveMember,
    handleSelectAll, isAssigning, isRemoving, loadingUsers, searchTerm,
    selectedUserIds, setSearchTerm, success, theme, toggleUser,
  }
}
