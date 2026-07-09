'use client'

import { useCallback, useDeferredValue, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { mutate } from 'swr'
import type { ToastType } from '@/core/components/ToastNotification/ToastNotification'
import type { KeptCourseWithProgress } from '@/features/admin/services/admin-learning-paths/course-access-provenance-cleanup.service'

import { BusinessLearningPathsService } from '../services/businessLearningPaths.service'
import { useBusinessLearningPaths } from './useBusinessLearningPaths'
import { useBusinessPanelTheme } from './useBusinessPanelTheme'
import { useBusinessUsers } from './useBusinessUsers'

export function useBusinessLearningPathsPageLogic() {
  const { t } = useTranslation('business')
  const params = useParams()
  const orgSlug = params?.orgSlug as string
  const theme = useBusinessPanelTheme()
  const {
    learningPaths,
    assignments,
    defaultRules,
    hierarchyNodes,
    isLoading,
    error,
    refetchSilent,
  } =
    useBusinessLearningPaths(orgSlug)
  const {
    users,
    isLoading: loadingUsers,
    error: usersError,
  } = useBusinessUsers(orgSlug)

  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const [selectedLearningPathId, setSelectedLearningPathId] = useState<string | null>(null)
  const [defaultConfigLearningPathId, setDefaultConfigLearningPathId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({ isOpen: false, message: '', type: 'success' })
  const showToast = useCallback((message: string, type: ToastType = 'success') => setToast({ isOpen: true, message, type }), [])
  const hideToast = useCallback(() => setToast(prev => ({ ...prev, isOpen: false })), [])
  const [pendingRevokeIds, setPendingRevokeIds] = useState<Set<string>>(new Set())
  const [revokingAssignmentId, setRevokingAssignmentId] = useState<string | null>(null)
  const [keptCoursesModal, setKeptCoursesModal] = useState<{
    userId: string
    revokedCount: number
    keptWithProgress: KeptCourseWithProgress[]
  } | null>(null)
  const [isForceRevokingKeptCourses, setIsForceRevokingKeptCourses] = useState(false)

  const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase()

  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === 'assigned'),
    [assignments],
  )

  // Optimistically exclude rows being revoked so they animate out immediately,
  // without waiting for the server response or triggering a full data reload.
  const visibleAssignments = useMemo(
    () => activeAssignments.filter((a) => !pendingRevokeIds.has(a.id)),
    [activeAssignments, pendingRevokeIds],
  )

  const assignmentsByPathId = useMemo(() => {
    return activeAssignments.reduce<Map<string, typeof activeAssignments>>((map, assignment) => {
      const existing = map.get(assignment.learning_path_id) || []
      existing.push(assignment)
      map.set(assignment.learning_path_id, existing)
      return map
    }, new Map())
  }, [activeAssignments])

  const activeDefaultRules = useMemo(
    () => defaultRules.filter((rule) => rule.status === 'active'),
    [defaultRules],
  )

  const defaultRulesByPathId = useMemo(() => {
    return activeDefaultRules.reduce<Map<string, typeof activeDefaultRules>>((map, rule) => {
      const existing = map.get(rule.learning_path_id) || []
      existing.push(rule)
      map.set(rule.learning_path_id, existing)
      return map
    }, new Map())
  }, [activeDefaultRules])

  const filteredLearningPaths = useMemo(() => {
    return learningPaths.filter((path) => {
      if (!normalizedSearchTerm) {
        return true
      }

      const matchesMetadata =
        path.title.toLowerCase().includes(normalizedSearchTerm) ||
        (path.description || '').toLowerCase().includes(normalizedSearchTerm)

      const matchesCourse = path.items.some((item) =>
        (item.course?.title || '').toLowerCase().includes(normalizedSearchTerm),
      )

      return matchesMetadata || matchesCourse
    })
  }, [learningPaths, normalizedSearchTerm])

  const selectedLearningPath = useMemo(
    () => learningPaths.find((path) => path.id === selectedLearningPathId) || null,
    [learningPaths, selectedLearningPathId],
  )

  const defaultConfigLearningPath = useMemo(
    () => learningPaths.find((path) => path.id === defaultConfigLearningPathId) || null,
    [defaultConfigLearningPathId, learningPaths],
  )

  const selectedPathAssignments = useMemo(() => {
    if (!selectedLearningPathId) {
      return []
    }

    return assignmentsByPathId.get(selectedLearningPathId) || []
  }, [assignmentsByPathId, selectedLearningPathId])

  const totalAssignedUsers = useMemo(
    () => new Set(activeAssignments.map((assignment) => assignment.user_id)).size,
    [activeAssignments],
  )

  const totalWorkshops = useMemo(
    () => learningPaths.reduce((count, path) => count + path.item_count, 0),
    [learningPaths],
  )

  async function handleAssignmentCreated() {
    await refetchSilent()
    showToast(t('learningPathsPage.messages.assignSuccess'))
  }

  async function handleDefaultRulesChanged(message?: string) {
    await refetchSilent()
    showToast(message || t('learningPathsPage.messages.defaultSaved'))
  }

  async function handleRevokeAssignment(assignmentId: string) {
    // Optimistic: remove row from visible list immediately so it animates out
    // before the server responds. Rolled back if the API call fails.
    setPendingRevokeIds((prev) => new Set(prev).add(assignmentId))
    setRevokingAssignmentId(assignmentId)
    try {
      const assignment = assignments.find((candidate) => candidate.id === assignmentId)
      const result = await BusinessLearningPathsService.revokeLearningPathAssignment(orgSlug, assignmentId)
      void mutate((key: unknown) => typeof key === 'string' && key.startsWith('business-user-dashboard:'))
      showToast(t('learningPathsPage.messages.revokeSuccess'))
      void refetchSilent()

      const keptWithProgress = (result.keptWithProgress || []) as KeptCourseWithProgress[]
      if (keptWithProgress.length > 0 && assignment) {
        setKeptCoursesModal({
          userId: assignment.user_id,
          revokedCount: typeof result.revokedCount === 'number' ? result.revokedCount : 0,
          keptWithProgress,
        })
      }
    } catch (revokeError) {
      // Rollback: restore the row so the user can retry
      setPendingRevokeIds((prev) => {
        const next = new Set(prev)
        next.delete(assignmentId)
        return next
      })
      showToast(
        revokeError instanceof Error
          ? revokeError.message
          : t('learningPathsPage.messages.revokeError', { defaultValue: 'No se pudo revocar la asignación' }),
        'error',
      )
    } finally {
      setRevokingAssignmentId(null)
    }
  }

  function closeKeptCoursesModal() {
    setKeptCoursesModal(null)
  }

  async function handleForceRevokeKeptCourses(courseIds: string[]) {
    if (!keptCoursesModal || courseIds.length === 0) return

    setIsForceRevokingKeptCourses(true)
    try {
      await BusinessLearningPathsService.forceRevokeKeptCourses(
        orgSlug,
        keptCoursesModal.userId,
        courseIds,
      )
      showToast(t('learningPathsPage.messages.forceRevokeSuccess', { defaultValue: 'Acceso a los cursos revocado' }))
      closeKeptCoursesModal()
    } catch (forceRevokeError) {
      showToast(
        forceRevokeError instanceof Error
          ? forceRevokeError.message
          : t('learningPathsPage.messages.forceRevokeError', { defaultValue: 'No se pudo revocar el acceso a los cursos' }),
        'error',
      )
    } finally {
      setIsForceRevokingKeptCourses(false)
    }
  }

  return {
    t,
    orgSlug,
    theme,
    learningPaths,
    filteredLearningPaths,
    assignments: visibleAssignments,
    assignmentsByPathId,
    defaultRules: activeDefaultRules,
    defaultRulesByPathId,
    hierarchyNodes,
    selectedLearningPath,
    defaultConfigLearningPath,
    selectedPathAssignments,
    users,
    isLoading,
    loadingUsers,
    error: error || usersError,
    searchTerm,
    setSearchTerm,
    toast,
    hideToast,
    totalAssignedUsers,
    totalWorkshops,
    selectedLearningPathId,
    setSelectedLearningPathId,
    defaultConfigLearningPathId,
    setDefaultConfigLearningPathId,
    revokingAssignmentId,
    handleAssignmentCreated,
    handleDefaultRulesChanged,
    handleRevokeAssignment,
    keptCoursesModal,
    closeKeptCoursesModal,
    handleForceRevokeKeptCourses,
    isForceRevokingKeptCourses,
  }
}
