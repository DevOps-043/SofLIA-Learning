import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useEffect, useState } from 'react'
import type { TFunction } from 'i18next'
import { useBusinessUsers } from '../../hooks/useBusinessUsers'
import {
  areAllUsersSelected,
  buildBusinessAssignCoursePayload,
  filterBusinessAssignableUsers,
  getSelectedUsers,
  getSelectableUserIds,
  normalizeLiaSuggestedDate,
  toggleSelectedUserId,
} from './service'

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
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [dueDate, setDueDate] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [alreadyAssignedUserIds, setAlreadyAssignedUserIds] = useState<Set<string>>(
    new Set(),
  )
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

  useEffect(() => {
    if (!isOpen || !courseId) {
      return
    }

    let isCancelled = false

    async function fetchAssignedUsers() {
      try {
        const response = await fetch(
          `/api/${orgSlug}/business/courses/${courseId}/assigned-users`,
          {
            credentials: 'include',
            cache: 'no-store',
          },
        )

        if (!response.ok) {
          return
        }

        const data = (await response.json()) as {
          user_ids?: string[]
          assigned_users?: Array<{ user_id: string; source: string; team_name?: string; learning_path_title?: string }>
          success?: boolean
        }
        if (!isCancelled && data.success && Array.isArray(data.user_ids)) {
          setAlreadyAssignedUserIds(new Set(data.user_ids))

          // Build source map
          if (Array.isArray(data.assigned_users)) {
            const sourceMap = new Map<string, { source: string; team_name?: string; learning_path_title?: string }>()
            for (const user of data.assigned_users) {
              sourceMap.set(user.user_id, {
                source: user.source,
                team_name: user.team_name,
                learning_path_title: user.learning_path_title,
              })
            }
            setAssignedUserSources(sourceMap)
          }
        }
      } catch (fetchError) {
        techDebtLogger.error('Error fetching assigned users:', fetchError)
      }
    }

    fetchAssignedUsers()

    return () => {
      isCancelled = true
    }
  }, [courseId, isOpen, orgSlug])

  const availableUsers = filterBusinessAssignableUsers(users, searchTerm)
  const selectableUserIds = getSelectableUserIds(availableUsers, alreadyAssignedUserIds)
  const availableUserCount = selectableUserIds.length
  const allUsersSelected = areAllUsersSelected(selectableUserIds, selectedUserIds)
  const selectedUserCount = selectableUserIds.filter((userId) =>
    selectedUserIds.has(userId),
  ).length
  const selectedUsers = getSelectedUsers(users, selectedUserIds)

  function resetState() {
    setSelectedUserIds(new Set())
    setPendingRemovalIds(new Set())
    setDueDate('')
    setError(null)
    setSearchTerm('')
    setSuggestionReason(null)
    setIsSuggesting(false)
  }

  function handleToggleUser(userId: string) {
    if (alreadyAssignedUserIds.has(userId)) {
      return
    }

    setSelectedUserIds((currentSelectedUserIds) =>
      toggleSelectedUserId(currentSelectedUserIds, userId),
    )
  }

  function handleToggleRemoval(userId: string) {
    const source = assignedUserSources.get(userId)?.source
    if (source !== 'direct') return

    setPendingRemovalIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  function handleSelectAllUsers() {
    if (selectableUserIds.length === 0) {
      return
    }

    setSelectedUserIds(
      allUsersSelected ? new Set() : new Set(selectableUserIds),
    )
  }

  async function handleAssign() {
    const hasAssignments = selectedUserIds.size > 0
    const hasRemovals = pendingRemovalIds.size > 0

    if (!hasAssignments && !hasRemovals) {
      setError(t('assignCourse.errors.selectUser'))
      return
    }

    setIsAssigning(true)
    setError(null)

    try {
      // Revocar asignaciones directas seleccionadas
      if (hasRemovals) {
        const deleteResponse = await fetch(`/api/${orgSlug}/business/courses/${courseId}/assign`, {
          method: 'DELETE',
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_ids: Array.from(pendingRemovalIds) }),
        })
        const deleteData = (await deleteResponse.json()) as { error?: string }
        if (!deleteResponse.ok) {
          throw new Error(deleteData.error ?? t('assignCourse.errors.assignFailed'))
        }
      }

      // Crear nuevas asignaciones
      if (hasAssignments) {
        const response = await fetch(`/api/${orgSlug}/business/courses/${courseId}/assign`, {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            buildBusinessAssignCoursePayload({ selectedUserIds, dueDate }),
          ),
        })
        const data = (await response.json()) as { error?: string }
        if (!response.ok) {
          throw new Error(data.error ?? t('assignCourse.errors.assignFailed'))
        }
      }

      resetState()
      onAssignComplete()
      onClose()
    } catch (assignError) {
      setError(
        assignError instanceof Error
          ? assignError.message
          : t('assignCourse.errors.assignFailed'),
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
      if (!jsonMatch) {
        return
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        suggested_date?: string
        reason?: string
      }
      const suggestedDate = normalizeLiaSuggestedDate(parsed.suggested_date)
      if (!suggestedDate) {
        return
      }

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
    availableUsers,
    availableUserCount,
    allUsersSelected,
    alreadyAssignedUserIds,
    assignedUserSources,
    dueDate,
    error,
    handleAssign,
    handleClose,
    handleSelectAllUsers,
    handleSuggestLiaDate,
    handleToggleRemoval,
    handleToggleUser,
    isAssigning,
    isSuggesting,
    loadingUsers,
    pendingRemovalIds,
    searchTerm,
    selectedUserCount,
    selectedUserIds,
    selectedUsers,
    setDueDate,
    setSearchTerm,
    setSuggestionReason,
    suggestionReason,
  }
}
