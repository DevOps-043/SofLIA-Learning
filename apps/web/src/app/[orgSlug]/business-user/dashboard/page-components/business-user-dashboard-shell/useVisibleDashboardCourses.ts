import { useEffect, useMemo, useState } from 'react'

import type { AssignedCourse } from '../../types'

const INITIAL_VISIBLE_COURSE_COUNT = 6
const LOAD_MORE_COURSE_COUNT = 6

export function useVisibleDashboardCourses(
  assignedCourses: AssignedCourse[],
  disableHeavyEffects: boolean,
) {
  const [visibleCourseCount, setVisibleCourseCount] = useState(
    disableHeavyEffects ? INITIAL_VISIBLE_COURSE_COUNT : assignedCourses.length,
  )

  useEffect(() => {
    setVisibleCourseCount(
      disableHeavyEffects ? INITIAL_VISIBLE_COURSE_COUNT : assignedCourses.length,
    )
  }, [assignedCourses.length, disableHeavyEffects])

  const displayedCourses = useMemo(() => {
    if (!disableHeavyEffects) {
      return assignedCourses
    }

    return assignedCourses.slice(0, visibleCourseCount)
  }, [assignedCourses, disableHeavyEffects, visibleCourseCount])

  const showMoreCourses = () => {
    setVisibleCourseCount((current) =>
      Math.min(current + LOAD_MORE_COURSE_COUNT, assignedCourses.length),
    )
  }

  return { displayedCourses, showMoreCourses }
}
