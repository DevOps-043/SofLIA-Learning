'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AdminFilterOption } from '../../../../hooks/useAdminUserStatsFilters'
import { addMembership, removeMembership, updateMembershipRole } from '../master-panel-api'
import type { MasterPanelMembership, OrganizationRole, ShowToast } from '../types'

interface UseOrganizationsTabLogicParams {
  userId: string
  memberships: MasterPanelMembership[]
  /** Catálogo global de organizaciones (viene de useAdminUserStatsFilters). */
  companyOptions: AdminFilterOption[]
  showToast: ShowToast
  refetchSilent: () => Promise<void>
}

export function useOrganizationsTabLogic({
  userId,
  memberships,
  companyOptions,
  showToast,
  refetchSilent,
}: UseOrganizationsTabLogicParams) {
  const { t } = useTranslation('admin')

  const [addOrgId, setAddOrgId] = useState('')
  const [addRole, setAddRole] = useState<OrganizationRole>('member')
  const [addJobTitle, setAddJobTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const [updatingRoleOrgId, setUpdatingRoleOrgId] = useState<string | null>(null)
  const [removeConfirmOrgId, setRemoveConfirmOrgId] = useState<string | null>(null)
  const [pendingRemovalIds, setPendingRemovalIds] = useState<Set<string>>(new Set())

  const activeMembershipOrgIds = useMemo(
    () => new Set(memberships.filter((m) => m.status === 'active').map((m) => m.organizationId)),
    [memberships],
  )

  const availableOrganizations = useMemo(
    () => companyOptions.filter((option) => !activeMembershipOrgIds.has(option.value)),
    [companyOptions, activeMembershipOrgIds],
  )

  const visibleMemberships = useMemo(
    () => memberships.filter((m) => !pendingRemovalIds.has(m.membershipId)),
    [memberships, pendingRemovalIds],
  )

  const handleAdd = async () => {
    if (!addOrgId) return
    setIsAdding(true)
    try {
      await addMembership(userId, {
        organizationId: addOrgId,
        role: addRole,
        jobTitle: addJobTitle.trim() || null,
      })
      showToast(t('users.masterPanel.organizations.added'))
      setAddOrgId('')
      setAddRole('member')
      setAddJobTitle('')
      await refetchSilent()
    } catch (error) {
      const message =
        error instanceof Error && error.name === 'MEMBER_ALREADY_EXISTS'
          ? t('users.masterPanel.organizations.alreadyMember')
          : error instanceof Error
            ? error.message
            : t('users.masterPanel.organizations.addError')
      showToast(message, 'error')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRoleChange = async (membership: MasterPanelMembership, role: OrganizationRole) => {
    if (membership.role === role) return
    setUpdatingRoleOrgId(membership.organizationId)
    try {
      await updateMembershipRole(membership.organizationId, userId, role)
      showToast(t('users.masterPanel.organizations.roleUpdated'))
      await refetchSilent()
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('users.page.errors.updateFailed'), 'error')
    } finally {
      setUpdatingRoleOrgId(null)
    }
  }

  const handleRemove = async (membership: MasterPanelMembership) => {
    setRemoveConfirmOrgId(null)
    setPendingRemovalIds((prev) => new Set(prev).add(membership.membershipId))
    try {
      await removeMembership(membership.organizationId, userId)
      showToast(t('users.masterPanel.organizations.removed'))
      await refetchSilent()
    } catch (error) {
      // Rollback optimista: el backend rechazó (p. ej. último owner).
      setPendingRemovalIds((prev) => {
        const next = new Set(prev)
        next.delete(membership.membershipId)
        return next
      })
      showToast(
        error instanceof Error ? error.message : t('users.masterPanel.organizations.removeError'),
        'error',
      )
    }
  }

  return {
    visibleMemberships,
    availableOrganizations,
    addOrgId,
    setAddOrgId,
    addRole,
    setAddRole,
    addJobTitle,
    setAddJobTitle,
    isAdding,
    handleAdd,
    updatingRoleOrgId,
    handleRoleChange,
    removeConfirmOrgId,
    setRemoveConfirmOrgId,
    handleRemove,
  }
}
