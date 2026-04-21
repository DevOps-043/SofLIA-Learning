'use client'

import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import { fetchStudyPlannerUserContext } from '../../services/planner-user-context-client.service'
import type { StudyPlannerAssignedCourse } from '../../types/planner-ui.types'

export function useRegisterDuplicatePlanHandler(params: {
  handleDuplicatePlanRef: MutableRefObject<() => void>
  loadUserCourses: (freshCourses?: StudyPlannerAssignedCourse[]) => void | Promise<void>
  setAssignedCourses: Dispatch<SetStateAction<StudyPlannerAssignedCourse[]>>
  setSelectedCourseIds: Dispatch<SetStateAction<string[]>>
}) {
  const {
    handleDuplicatePlanRef,
    loadUserCourses,
    setAssignedCourses,
    setSelectedCourseIds,
  } = params

  useEffect(() => {
    handleDuplicatePlanRef.current = async () => {
      let freshCourses: StudyPlannerAssignedCourse[] | undefined

      try {
        const userData = await fetchStudyPlannerUserContext()
        if (userData.success) {
          setAssignedCourses(userData.assignedCourses)
          freshCourses = userData.assignedCourses
        }
      } catch {
        // If refresh fails, the selector will still block active plans later.
      }

      setSelectedCourseIds([])
      void loadUserCourses(freshCourses)
    }
  }, [handleDuplicatePlanRef, loadUserCourses, setAssignedCourses, setSelectedCourseIds])
}
