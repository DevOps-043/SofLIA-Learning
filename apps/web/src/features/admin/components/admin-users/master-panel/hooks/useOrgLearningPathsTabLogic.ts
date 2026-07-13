'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { assignLearningPath, getOrgLearningPathCatalog, revokeLearningPath } from '../master-panel-api'
import type {
  MasterPanelLearningPathAssignment,
  OrgLearningPathCatalogItem,
  ShowToast,
} from '../types'

interface UseOrgLearningPathsTabLogicParams {
  userId: string
  selectedOrgId: string
  learningPathAssignments: MasterPanelLearningPathAssignment[]
  showToast: ShowToast
  refetchSilent: () => Promise<void>
}

export function useOrgLearningPathsTabLogic({
  userId,
  selectedOrgId,
  learningPathAssignments,
  showToast,
  refetchSilent,
}: UseOrgLearningPathsTabLogicParams) {
  const { t } = useTranslation('admin')

  const [catalog, setCatalog] = useState<OrgLearningPathCatalogItem[]>([])
  const [isCatalogLoading, setIsCatalogLoading] = useState(false)

  const [assigningPathId, setAssigningPathId] = useState<string | null>(null)
  const [pendingRemovalIds, setPendingRemovalIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!selectedOrgId) {
      setCatalog([])
      return
    }
    let cancelled = false
    setIsCatalogLoading(true)
    // La capa API cachea por organización con TTL: cambiar de tab o de org
    // recientemente visitada resuelve sin ir a la red.
    getOrgLearningPathCatalog(selectedOrgId)
      .then((items) => {
        if (cancelled) return
        setCatalog(items)
      })
      .catch((error) => {
        if (!cancelled) {
          showToast(
            error instanceof Error ? error.message : t('users.masterPanel.learningPaths.catalogError'),
            'error',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsCatalogLoading(false)
      })
    return () => {
      cancelled = true
    }
    // showToast/t estables; solo recargamos al cambiar de organización.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrgId])

  const orgAssignments = useMemo(
    () =>
      learningPathAssignments.filter(
        (assignment) =>
          assignment.organizationId === selectedOrgId && !pendingRemovalIds.has(assignment.id),
      ),
    [learningPathAssignments, selectedOrgId, pendingRemovalIds],
  )

  const availablePaths = useMemo(() => {
    const assignedPathIds = new Set(orgAssignments.map((a) => a.learningPathId))
    return catalog.filter((item) => !assignedPathIds.has(item.learningPathId))
  }, [catalog, orgAssignments])

  const handleAssign = async (learningPathId: string) => {
    if (!selectedOrgId) return
    setAssigningPathId(learningPathId)
    try {
      await assignLearningPath(selectedOrgId, userId, learningPathId)
      showToast(t('users.masterPanel.learningPaths.assigned'))
      await refetchSilent()
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : t('users.masterPanel.learningPaths.assignError'),
        'error',
      )
    } finally {
      setAssigningPathId(null)
    }
  }

  const handleRevoke = async (assignmentId: string) => {
    if (!selectedOrgId) return
    setPendingRemovalIds((prev) => new Set(prev).add(assignmentId))
    try {
      await revokeLearningPath(selectedOrgId, assignmentId)
      showToast(t('users.masterPanel.learningPaths.revoked'))
      await refetchSilent()
    } catch (error) {
      setPendingRemovalIds((prev) => {
        const next = new Set(prev)
        next.delete(assignmentId)
        return next
      })
      showToast(
        error instanceof Error ? error.message : t('users.masterPanel.learningPaths.revokeError'),
        'error',
      )
    }
  }

  return {
    orgAssignments,
    availablePaths,
    isCatalogLoading,
    assigningPathId,
    handleAssign,
    handleRevoke,
  }
}
