'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { assignCourse, getOrgCourseCatalog, removeCourseAssignment } from '../master-panel-api'
import type { MasterPanelCourseAssignment, OrgCourseCatalogItem, ShowToast } from '../types'

interface UseOrgCoursesTabLogicParams {
  userId: string
  selectedOrgId: string
  courseAssignments: MasterPanelCourseAssignment[]
  showToast: ShowToast
  refetchSilent: () => Promise<void>
}

export function useOrgCoursesTabLogic({
  userId,
  selectedOrgId,
  courseAssignments,
  showToast,
  refetchSilent,
}: UseOrgCoursesTabLogicParams) {
  const { t } = useTranslation('admin')

  const [catalog, setCatalog] = useState<OrgCourseCatalogItem[]>([])
  const [isCatalogLoading, setIsCatalogLoading] = useState(false)

  const [assigningCourseId, setAssigningCourseId] = useState<string | null>(null)
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
    getOrgCourseCatalog(selectedOrgId)
      .then((items) => {
        if (cancelled) return
        setCatalog(items)
      })
      .catch((error) => {
        if (!cancelled) {
          showToast(
            error instanceof Error ? error.message : t('users.masterPanel.courses.catalogError'),
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
      courseAssignments.filter(
        (assignment) =>
          assignment.organizationId === selectedOrgId &&
          !pendingRemovalIds.has(assignment.id) &&
          (assignment.status === null ||
            assignment.status === 'assigned' ||
            assignment.status === 'in_progress' ||
            assignment.status === 'completed'),
      ),
    [courseAssignments, selectedOrgId, pendingRemovalIds],
  )

  const availableCourses = useMemo(() => {
    const assignedCourseIds = new Set(orgAssignments.map((a) => a.courseId))
    return catalog.filter((item) => !assignedCourseIds.has(item.courseId))
  }, [catalog, orgAssignments])

  const handleAssign = async (courseId: string) => {
    if (!selectedOrgId) return
    setAssigningCourseId(courseId)
    try {
      await assignCourse(selectedOrgId, userId, courseId)
      showToast(t('users.masterPanel.courses.assigned'))
      await refetchSilent()
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : t('users.masterPanel.courses.assignError'),
        'error',
      )
    } finally {
      setAssigningCourseId(null)
    }
  }

  const handleRemove = async (assignmentId: string) => {
    if (!selectedOrgId) return
    setPendingRemovalIds((prev) => new Set(prev).add(assignmentId))
    try {
      await removeCourseAssignment(selectedOrgId, assignmentId)
      showToast(t('users.masterPanel.courses.removed'))
      await refetchSilent()
    } catch (error) {
      setPendingRemovalIds((prev) => {
        const next = new Set(prev)
        next.delete(assignmentId)
        return next
      })
      showToast(
        error instanceof Error ? error.message : t('users.masterPanel.courses.removeError'),
        'error',
      )
    }
  }

  return {
    orgAssignments,
    availableCourses,
    isCatalogLoading,
    assigningCourseId,
    handleAssign,
    handleRemove,
  }
}
