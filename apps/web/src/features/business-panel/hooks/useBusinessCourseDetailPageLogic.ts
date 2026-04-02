'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useThemeStore } from '../../../core/stores/themeStore'
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
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const primaryColor = panelStyles?.primary_button_color || (isDark ? '#8B5CF6' : '#6366F1')
  const accentColor = panelStyles?.accent_color || '#10B981'
  const cardBackground = isDark ? (panelStyles?.card_background || '#1E2329') : '#FFFFFF'
  const textColor = isDark ? (panelStyles?.text_color || '#FFFFFF') : '#0F172A'
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

  const [course, setCourse] = useState<BusinessCourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<BusinessCourseDetailTabId>('info')
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
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
    isDark,
    primaryColor,
    accentColor,
    cardBackground,
    textColor,
    borderColor,
    levelStyles,
    toggleModule,
    handlePurchase,
    retryLoad: loadCourse,
    formatDuration: formatBusinessCourseDuration,
    formatDurationSeconds: formatBusinessCourseDurationSeconds,
    formatDate: formatBusinessCourseDate
  }
}
