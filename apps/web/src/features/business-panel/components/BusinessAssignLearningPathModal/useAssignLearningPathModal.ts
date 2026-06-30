'use client'

import { useEffect, useMemo, useState } from 'react'
import { mutate } from 'swr'
import { assignLearningPathSelection } from './assign-learning-path-selection'
import { validateAssignmentSelection } from './validate-assignment-selection'
import type { BusinessAssignLearningPathModalProps, BusinessTranslate, AssignmentMode } from './types'
import { getUserDisplayName } from './utils'
type UseAssignLearningPathModalParams = BusinessAssignLearningPathModalProps & {
  t: BusinessTranslate
}
export function useAssignLearningPathModal({
  isOpen,
  learningPath,
  users,
  existingAssignments,
  onAssigned,
  onClose,
  orgSlug,
  t,
}: UseAssignLearningPathModalParams) {
  const [searchTerm, setSearchTerm] = useState('')
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('users')
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set())
  const [includeDescendants, setIncludeDescendants] = useState(true)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    setSearchTerm('')
    setAssignmentMode('users')
    setSelectedNodeIds(new Set())
    setIncludeDescendants(true)
    setSelectedUserIds(new Set())
    setError(null)
  }, [isOpen, learningPath?.id])
  const activeUsers = useMemo(() => users.filter((user) => user.org_status === 'active'), [users])
  const alreadyAssignedUserIds = useMemo(
    () => new Set(existingAssignments.map((assignment) => assignment.user_id)),
    [existingAssignments],
  )
  const filteredUsers = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase()
    return activeUsers.filter((user) => {
      if (!normalizedSearchTerm) return true
      const displayName = getUserDisplayName(user).toLowerCase()
      return displayName.includes(normalizedSearchTerm) || user.email.toLowerCase().includes(normalizedSearchTerm)
    })
  }, [activeUsers, searchTerm])
  const selectableUserIds = useMemo(
    () => filteredUsers.filter((user) => !alreadyAssignedUserIds.has(user.id)).map((user) => user.id),
    [alreadyAssignedUserIds, filteredUsers],
  )
  const allUsersSelected = selectableUserIds.length > 0 && selectableUserIds.every((id) => selectedUserIds.has(id))
  function handleToggleUser(userId: string) {
    setSelectedUserIds((current) => toggleSetValue(current, userId))
  }
  function handleToggleNode(nodeId: string) {
    setSelectedNodeIds((current) => toggleSetValue(current, nodeId))
  }
  function handleToggleAllUsers() {
    setSelectedUserIds((current) => {
      const next = new Set(current)
      selectableUserIds.forEach((id) => allUsersSelected ? next.delete(id) : next.add(id))
      return next
    })
  }
  async function handleAssign() {
    if (!learningPath || !validateAssignmentSelection({ assignmentMode, selectedNodeIds, selectedUserIds, setError, t })) return
    try {
      setIsAssigning(true)
      setError(null)
      await assignLearningPathSelection({
        assignmentMode,
        includeDescendants,
        learningPathId: learningPath.id,
        orgSlug,
        selectedNodeIds,
        selectedUserIds,
      })
      // Invalidate business-user dashboard cache so affected users see updated
      // LP assignments without waiting for the SWR dedupingInterval to expire.
      void mutate((key: unknown) => typeof key === 'string' && key.startsWith('business-user-dashboard:'))
      await onAssigned()
      onClose()
    } catch (assignmentError) {
      setError(assignmentError instanceof Error ? assignmentError.message : t('assignLearningPath.assignError'))
    } finally {
      setIsAssigning(false)
    }
  }
  return { activeUsers, alreadyAssignedUserIds, allUsersSelected, assignmentMode, error, filteredUsers, handleAssign, handleToggleAllUsers, handleToggleNode, handleToggleUser, includeDescendants, isAssigning, searchTerm, selectedNodeIds, selectedUserIds, setAssignmentMode, setIncludeDescendants, setSearchTerm }
}
function toggleSetValue(current: Set<string>, value: string) {
  const next = new Set(current)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}
