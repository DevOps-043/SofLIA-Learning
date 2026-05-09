'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'

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
    refetch,
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
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [revokingAssignmentId, setRevokingAssignmentId] = useState<string | null>(null)

  const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase()

  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === 'assigned'),
    [assignments],
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
    await refetch()
    setFeedback({
      type: 'success',
      message: t('learningPathsPage.messages.assignSuccess'),
    })
  }

  async function handleDefaultRulesChanged(message?: string) {
    await refetch()
    setFeedback({
      type: 'success',
      message: message || t('learningPathsPage.messages.defaultSaved'),
    })
  }

  async function handleRevokeAssignment(assignmentId: string) {
    try {
      setRevokingAssignmentId(assignmentId)
      await BusinessLearningPathsService.revokeLearningPathAssignment(orgSlug, assignmentId)
      await refetch()
      setFeedback({
        type: 'success',
        message: t('learningPathsPage.messages.revokeSuccess'),
      })
    } catch (revokeError) {
      setFeedback({
        type: 'error',
        message:
          revokeError instanceof Error
            ? revokeError.message
            : t('learningPathsPage.messages.revokeError', {
                defaultValue: 'No se pudo revocar la asignación',
              }),
      })
    } finally {
      setRevokingAssignmentId(null)
    }
  }

  return {
    t,
    orgSlug,
    theme,
    learningPaths,
    filteredLearningPaths,
    assignments: activeAssignments,
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
    feedback,
    setFeedback,
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
  }
}
