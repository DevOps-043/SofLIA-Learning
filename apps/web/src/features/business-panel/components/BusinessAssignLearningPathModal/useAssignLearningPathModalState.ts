import { useEffect, useMemo, useState } from 'react'
import type { BusinessUser } from '../../services/businessUsers.service'
import type { BusinessLearningPath, BusinessLearningPathAssignment } from '../../services/businessLearningPaths.service'
import { assignLearningPathByMode } from './assignment-api'
import type { AssignmentMode, BusinessT } from './types'
import { getUserDisplayName } from './utils'

export function useAssignLearningPathModalState(params: {
  existingAssignments: BusinessLearningPathAssignment[]
  isOpen: boolean
  learningPath: BusinessLearningPath | null
  onAssigned: () => Promise<void>
  onClose: () => void
  orgSlug: string
  t: BusinessT
  users: BusinessUser[]
}) {
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
  }, [params.isOpen, params.learningPath?.id])

  const activeUsers = useMemo(() => params.users.filter((user) => user.org_status === 'active'), [params.users])
  const alreadyAssignedUserIds = useMemo(() => new Set(params.existingAssignments.map((assignment) => assignment.user_id)), [params.existingAssignments])
  const filteredUsers = useMemo(() => filterUsers(activeUsers, searchTerm), [activeUsers, searchTerm])
  const selectableUserIds = useMemo(() => filteredUsers.filter((user) => !alreadyAssignedUserIds.has(user.id)).map((user) => user.id), [alreadyAssignedUserIds, filteredUsers])
  const allUsersSelected = selectableUserIds.length > 0 && selectableUserIds.every((userId) => selectedUserIds.has(userId))

  function handleToggleUser(userId: string) { setSelectedUserIds((current) => toggleSetValue(current, userId)) }
  function handleToggleNode(nodeId: string) { setSelectedNodeIds((current) => toggleSetValue(current, nodeId)) }
  function handleToggleAllUsers() {
    setSelectedUserIds((current) => {
      const next = new Set(current)
      selectableUserIds.forEach((userId) => allUsersSelected ? next.delete(userId) : next.add(userId))
      return next
    })
  }

  async function handleAssign() {
    if (!params.learningPath || !validateSelection()) return
    try {
      setIsAssigning(true)
      setError(null)
      await assignLearningPathByMode({ assignmentMode, includeDescendants, learningPathId: params.learningPath.id, orgSlug: params.orgSlug, selectedNodeIds, selectedUserIds })
      await params.onAssigned()
      params.onClose()
    } catch (assignmentError) {
      setError(assignmentError instanceof Error ? assignmentError.message : params.t('assignLearningPath.assignError', { defaultValue: 'No se pudo asignar la ruta de aprendizaje.' }))
    } finally {
      setIsAssigning(false)
    }
  }

  function validateSelection() {
    if (assignmentMode === 'users' && selectedUserIds.size === 0) {
      setError(params.t('assignLearningPath.selectUserError', { defaultValue: 'Selecciona al menos un usuario para asignar la ruta.' }))
      return false
    }
    if (assignmentMode === 'node' && selectedNodeIds.size === 0) { setError(params.t('assignLearningPath.selectNodeError')); return false }
    return true
  }

  return { activeUsers, alreadyAssignedUserIds, allUsersSelected, assignmentMode, error, filteredUsers, handleAssign, handleToggleAllUsers, handleToggleNode, handleToggleUser, includeDescendants, isAssigning, searchTerm, selectableUserIds, selectedNodeIds, selectedUserIds, setAssignmentMode, setIncludeDescendants, setSearchTerm }
}

function filterUsers(users: BusinessUser[], searchTerm: string) {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  if (!normalizedSearchTerm) return users
  return users.filter((user) => getUserDisplayName(user).toLowerCase().includes(normalizedSearchTerm) || user.email.toLowerCase().includes(normalizedSearchTerm))
}

function toggleSetValue(values: Set<string>, value: string) {
  const next = new Set(values)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}
