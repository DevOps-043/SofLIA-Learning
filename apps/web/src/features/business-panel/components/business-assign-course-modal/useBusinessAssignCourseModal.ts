'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useEffect, useState } from 'react'
import type { TFunction } from 'i18next'
import { useBusinessUsers } from '../../hooks/useBusinessUsers'
import type { BusinessLearningPathHierarchyNode } from '../../services/businessLearningPaths.service'
import {
  areAllUsersSelected,
  buildBusinessAssignCoursePayload,
  filterBusinessAssignableUsers,
  getSelectedUsers,
  getSelectableUserIds,
  normalizeLiaSuggestedDate,
  toggleSelectedUserId,
} from './service'
import type { AssignmentMode } from './types'

interface UseBusinessAssignCourseModalParams {
  isOpen: boolean
  courseId: string
  courseTitle: string
  orgSlug: string
  onAssignComplete: () => void
  onClose: () => void
  t: TFunction
}

export function useBusinessAssignCourseModal({
  isOpen,
  courseId,
  courseTitle,
  orgSlug,
  onAssignComplete,
  onClose,
  t,
}: UseBusinessAssignCourseModalParams) {
  const { users, isLoading: loadingUsers, syncOrgData: refetchUsers } =
    useBusinessUsers(orgSlug)

  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('users')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set())
  const [includeDescendants, setIncludeDescendants] = useState(true)
  const [hierarchyNodes, setHierarchyNodes] = useState<BusinessLearningPathHierarchyNode[]>([])
  const [dueDate, setDueDate] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [alreadyAssignedUserIds, setAlreadyAssignedUserIds] = useState<Set<string>>(new Set())
  const [assignedUserSources, setAssignedUserSources] = useState<Map<string, { source: string; team_name?: string; learning_path_title?: string }>>(new Map())
  const [pendingRemovalIds, setPendingRemovalIds] = useState<Set<string>>(new Set())
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [suggestionReason, setSuggestionReason] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      refetchUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Fetch already-assigned users
  useEffect(() => {
    if (!isOpen || !courseId) return

    let isCancelled = false

    async function fetchAssignedUsers() {
      try {
        const response = await fetch(
          `/api/${orgSlug}/business/courses/${courseId}/assigned-users`,
          { credentials: 'include', cache: 'no-store' },
        )
        if (!response.ok) return

        const data = (await response.json()) as {
          user_ids?: string[]
          assigned_users?: Array<{ user_id: string; source: string; team_name?: string; learning_path_title?: string }>
          success?: boolean
        }
        if (!isCancelled && data.success && Array.isArray(data.user_ids)) {
          setAlreadyAssignedUserIds(new Set(data.user_ids))
          if (Array.isArray(data.assigned_users)) {
            const sourceMap = new Map<string, { source: string; team_name?: string; learning_path_title?: string }>()
            for (const user of data.assigned_users) {
              sourceMap.set(user.user_id, { source: user.source, team_name: user.team_name, learning_path_title: user.learning_path_title })
            }
            setAssignedUserSources(sourceMap)
          }
        }
      } catch (fetchError) {
        techDebtLogger.error('Error fetching assigned users:', fetchError)
      }
    }

    void fetchAssignedUsers()
    return () => { isCancelled = true }
  }, [courseId, isOpen, orgSlug])

  // Fetch hierarchy nodes for structure-based assignment
  useEffect(() => {
    if (!isOpen || !orgSlug) return

    let isCancelled = false

    async function fetchHierarchyNodes() {
      try {
        const response = await fetch(`/api/${orgSlug}/business/hierarchy-nodes`, {
          credentials: 'include',
          cache: 'no-store',
        })
        if (!response.ok || isCancelled) return
        const data = (await response.json()) as { hierarchyNodes?: BusinessLearningPathHierarchyNode[] }
        if (!isCancelled && Array.isArray(data.hierarchyNodes)) {
          setHierarchyNodes(data.hierarchyNodes)
        }
      } catch {
        // Non-critical: structure tab will show an empty state
      }
    }

    void fetchHierarchyNodes()
    return () => { isCancelled = true }
  }, [isOpen, orgSlug])

  const availableUsers = filterBusinessAssignableUsers(users, searchTerm)
  const selectableUserIds = getSelectableUserIds(availableUsers, alreadyAssignedUserIds)
  const availableUserCount = selectableUserIds.length
  const activeUserCount = users.filter((u) => u.org_status === 'active').length
  const allUsersSelected = areAllUsersSelected(selectableUserIds, selectedUserIds)
  const selectedUserCount = selectableUserIds.filter((userId) => selectedUserIds.has(userId)).length
  const selectedUsers = getSelectedUsers(users, selectedUserIds)

  function resetState() {
    setAssignmentMode('users')
    setSelectedUserIds(new Set())
    setSelectedNodeIds(new Set())
    setIncludeDescendants(true)
    setPendingRemovalIds(new Set())
    setDueDate('')
    setError(null)
    setSearchTerm('')
    setSuggestionReason(null)
    setIsSuggesting(false)
  }

  function handleToggleUser(userId: string) {
    if (alreadyAssignedUserIds.has(userId)) return
    setSelectedUserIds((current) => toggleSelectedUserId(current, userId))
  }

  function handleToggleNode(nodeId: string) {
    setSelectedNodeIds((current) => {
      const next = new Set(current)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  function handleToggleRemoval(userId: string) {
    const source = assignedUserSources.get(userId)?.source
    if (source !== 'direct') return
    setPendingRemovalIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  function handleSelectAllUsers() {
    if (selectableUserIds.length === 0) return
    setSelectedUserIds(allUsersSelected ? new Set() : new Set(selectableUserIds))
  }

  async function handleAssign() {
    if (assignmentMode === 'users') {
      if (selectedUserIds.size === 0 && pendingRemovalIds.size === 0) {
        setError(t('assignCourse.errors.selectUser'))
        return
      }
    } else if (assignmentMode === 'node' && selectedNodeIds.size === 0) {
      setError(t('assignCourse.errors.selectNode', { defaultValue: 'Selecciona al menos un nodo de estructura' }))
      return
    }

    setIsAssigning(true)
    setError(null)

    try {
      if (assignmentMode === 'users') {
        if (pendingRemovalIds.size > 0) {
          const deleteResponse = await fetch(`/api/${orgSlug}/business/courses/${courseId}/assign`, {
            method: 'DELETE',
            credentials: 'include',
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_ids: Array.from(pendingRemovalIds) }),
          })
          const deleteData = (await deleteResponse.json()) as { error?: string }
          if (!deleteResponse.ok) throw new Error(deleteData.error ?? t('assignCourse.errors.assignFailed'))
        }

        if (selectedUserIds.size > 0) {
          const response = await fetch(`/api/${orgSlug}/business/courses/${courseId}/assign`, {
            method: 'POST',
            credentials: 'include',
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildBusinessAssignCoursePayload({ selectedUserIds, dueDate })),
          })
          const data = (await response.json()) as { error?: string }
          if (!response.ok) throw new Error(data.error ?? t('assignCourse.errors.assignFailed'))
        }
      } else {
        const target =
          assignmentMode === 'all'
            ? { type: 'all' as const }
            : { type: 'node' as const, nodeIds: Array.from(selectedNodeIds), includeDescendants }

        const response = await fetch(`/api/${orgSlug}/business/courses/${courseId}/assign`, {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target, due_date: dueDate || null, start_date: null, approach: null, message: null }),
        })
        const data = (await response.json()) as { error?: string }
        if (!response.ok) throw new Error(data.error ?? t('assignCourse.errors.assignFailed'))
      }

      resetState()
      onAssignComplete()
      onClose()
    } catch (assignError) {
      setError(
        assignError instanceof Error ? assignError.message : t('assignCourse.errors.assignFailed'),
      )
    } finally {
      setIsAssigning(false)
    }
  }

  async function handleSuggestLiaDate() {
    setIsSuggesting(true)
    setSuggestionReason(null)

    try {
      const today = new Date().toLocaleDateString('es-MX')
      const response = await fetch('/api/lia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Actúa como un planificador de formación experto (SofLIA).
Estoy asignando el curso "${courseTitle}" (ID: ${courseId}).
Analiza la duración típica y complejidad de un curso con este título.
Sugiere una fecha límite realista (deadline) contando desde hoy (${today}), asumiendo un ritmo de estudio profesional (2-3 horas semanales).

IMPORTANTE: Tu respuesta debe ser EXCLUSIVAMENTE un objeto JSON válido con este formato exacto (sin bloques de código markdown):
{ "suggested_date": "YYYY-MM-DD", "reason": "breve explicación de 15 palabras máximo" }`,
            },
          ],
          stream: false,
        }),
      })

      const data = (await response.json()) as { message?: { content?: string } }
      const content = data.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return

      const parsed = JSON.parse(jsonMatch[0]) as { suggested_date?: string; reason?: string }
      const suggestedDate = normalizeLiaSuggestedDate(parsed.suggested_date)
      if (!suggestedDate) return

      setDueDate(suggestedDate)
      setSuggestionReason(parsed.reason || null)
    } catch (suggestError) {
      techDebtLogger.error('Error obteniendo sugerencia de LIA:', suggestError)
    } finally {
      setIsSuggesting(false)
    }
  }

  function handleClose() {
    resetState()
    onClose()
  }

  return {
    // Mode
    assignmentMode,
    setAssignmentMode,
    // Users mode
    availableUsers,
    availableUserCount,
    activeUserCount,
    allUsersSelected,
    alreadyAssignedUserIds,
    assignedUserSources,
    selectedUserCount,
    selectedUserIds,
    selectedUsers,
    handleToggleUser,
    handleSelectAllUsers,
    handleToggleRemoval,
    pendingRemovalIds,
    // Node mode
    hierarchyNodes,
    selectedNodeIds,
    includeDescendants,
    handleToggleNode,
    setIncludeDescendants,
    // Config
    dueDate,
    setDueDate,
    setSuggestionReason,
    suggestionReason,
    isSuggesting,
    handleSuggestLiaDate,
    // Common
    error,
    isAssigning,
    loadingUsers,
    searchTerm,
    setSearchTerm,
    handleAssign,
    handleClose,
  }
}
