'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useBusinessPanelTheme } from './useBusinessPanelTheme'
import { BusinessCourseDetailService } from '../services/business-course-detail.service'
import {
  formatBusinessCourseDate,
  formatBusinessCourseDuration,
  formatBusinessCourseDurationSeconds,
  getBusinessCourseLevelStyles
} from '../services/business-course-detail-display.service'
import type { BusinessCourseDetail, BusinessCourseDetailTabId } from '../types/business-course-detail.types'

export function useBusinessCourseDetailPageLogic() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const orgSlug = params.orgSlug as string
  const {
    isDark,
    primaryColor,
    onPrimaryColor,
    accentColor,
    cardBg,
    textColor,
    mutedTextColor,
    borderColor,
    dividerColor,
    successColor,
    dangerColor,
  } = useBusinessPanelTheme()

  const [course, setCourse] = useState<BusinessCourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<BusinessCourseDetailTabId>('info')
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assignmentRefreshKey, setAssignmentRefreshKey] = useState(0)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)

  const loadCourse = async () => {
    if (!courseId) {
      setError('ID de curso no valido')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const detail = await BusinessCourseDetailService.getCourseDetail(orgSlug, courseId)
      setCourse(detail)
      if (detail.modules.length > 0) {
        setExpandedModules(new Set([detail.modules[0].module_id]))
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error al cargar el curso')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCourse()
  }, [courseId, orgSlug])

  const toggleModule = (moduleId: string) => {
    setExpandedModules(previousModules => {
      const nextModules = new Set(previousModules)
      if (nextModules.has(moduleId)) {
        nextModules.delete(moduleId)
      } else {
        nextModules.add(moduleId)
      }
      return nextModules
    })
  }

  const handlePurchase = async () => {
    setIsPurchasing(true)
    setPurchaseError(null)
    setPurchaseSuccess(false)

    try {
      await BusinessCourseDetailService.purchaseCourse(orgSlug, courseId)
      setPurchaseSuccess(true)
      await loadCourse()
    } catch (purchaseIssue) {
      setPurchaseError(purchaseIssue instanceof Error ? purchaseIssue.message : 'Error al adquirir el curso')
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleAssignmentComplete = async () => {
    setAssignmentRefreshKey((currentKey) => currentKey + 1)
    await loadCourse()
  }

  const levelStyles = useMemo(
    () => getBusinessCourseLevelStyles(course?.level || null, primaryColor, accentColor),
    [accentColor, course?.level, primaryColor]
  )

  return {
    params,
    router,
    courseId,
    orgSlug,
    course,
    loading,
    error,
    expandedModules,
    activeTab,
    setActiveTab,
    isAssignModalOpen,
    setIsAssignModalOpen,
    isPurchasing,
    purchaseSuccess,
    purchaseError,
    assignmentRefreshKey,
    isDark,
    primaryColor,
    onPrimaryColor,
    accentColor,
    cardBackground: cardBg,
    textColor,
    mutedTextColor,
    borderColor,
    dividerColor,
    successColor,
    dangerColor,
    levelStyles,
    toggleModule,
    handlePurchase,
    handleAssignmentComplete,
    retryLoad: loadCourse,
    formatDuration: formatBusinessCourseDuration,
    formatDurationSeconds: formatBusinessCourseDurationSeconds,
    formatDate: formatBusinessCourseDate
  }
}
