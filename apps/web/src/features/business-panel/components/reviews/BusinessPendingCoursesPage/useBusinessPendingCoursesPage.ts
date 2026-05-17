'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminPendingCourses } from '@/features/admin/hooks/useAdminPendingCourses'
import { useFeatureTour } from '@/features/tours/hooks/useFeatureTour'
import {
  ADMIN_REVIEWS_TOUR_ID,
  getAdminReviewsSteps,
} from '@/features/tours/config/business-panel/admin-reviews-steps'
import { filterReviewCourses, getReviewCounts } from './review-course-utils'
import type { ReviewTab } from './types'

export function useBusinessPendingCoursesPage() {
  const { courses, isLoading, error, approveCourse, rejectCourse, deleteCourse } =
    useAdminPendingCourses()
  const { i18n, t: tBusiness } = useTranslation('business')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<ReviewTab>('pending')
  const [courseToApprove, setCourseToApprove] = useState<string | null>(null)
  const [courseToReject, setCourseToReject] = useState<string | null>(null)
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null)
  const deferredSearchTerm = useDeferredValue(searchTerm)

  const tReviews = (key: string) => tBusiness(`reviewsPage.${key}`)
  const tourSteps = useMemo(() => getAdminReviewsSteps(tBusiness), [tBusiness])
  const { joyrideProps } = useFeatureTour({
    tourId: ADMIN_REVIEWS_TOUR_ID,
    steps: tourSteps,
    enabled: !isLoading,
  })

  const counts = useMemo(() => getReviewCounts(courses), [courses])
  const filteredCourses = useMemo(
    () =>
      filterReviewCourses({
        activeTab,
        courses,
        searchTerm: deferredSearchTerm,
      }),
    [activeTab, courses, deferredSearchTerm],
  )

  const handleApprove = async () => {
    if (!courseToApprove) return
    await approveCourse(courseToApprove, '')
    setCourseToApprove(null)
  }

  const handleReject = async () => {
    if (!courseToReject) return
    await rejectCourse(courseToReject, tReviews('rejectReason'))
    setCourseToReject(null)
  }

  const handleDelete = async () => {
    if (!courseToDelete) return
    await deleteCourse(courseToDelete)
    setCourseToDelete(null)
  }

  return {
    activeTab,
    courseToApprove,
    courseToDelete,
    courseToReject,
    counts,
    error,
    filteredCourses,
    handleApprove,
    handleDelete,
    handleReject,
    i18n,
    isLoading,
    joyrideProps,
    searchTerm,
    setActiveTab,
    setCourseToApprove,
    setCourseToDelete,
    setCourseToReject,
    setSearchTerm,
    tReviews,
  }
}
