'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
import type { ToastType } from '@/core/components/ToastNotification/ToastNotification'
import { logger } from '@/lib/utils/logger'
import {
  BusinessCourseDefaultsService,
  type BusinessCourseDefaultRule,
  type BusinessCourseHierarchyNode,
} from '../services/businessCourseDefaults.service'

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
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)

  const [isDefaultModalOpen, setIsDefaultModalOpen] = useState(false)
  const [defaultRules, setDefaultRules] = useState<BusinessCourseDefaultRule[]>([])
  const [hierarchyNodes, setHierarchyNodes] = useState<BusinessCourseHierarchyNode[]>([])
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
    isOpen: false,
    message: '',
    type: 'success',
  })

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
    await loadCourse()
  }

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ isOpen: true, message, type })
  }, [])

  const hideToast = useCallback(() => {
    setToast((previousToast) => ({ ...previousToast, isOpen: false }))
  }, [])

  const loadCourseDefaults = async () => {
    try {
      const { rules, nodes } = await BusinessCourseDefaultsService.getCourseDefaults(orgSlug)
      setDefaultRules(rules)
      setHierarchyNodes(nodes)
    } catch (loadError) {
      logger.error('Error loading course default rules:', loadError)
    }
  }

  useEffect(() => {
    if (isDefaultModalOpen) void loadCourseDefaults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDefaultModalOpen])

  const handleDefaultRulesChanged = async (message?: string) => {
    await loadCourseDefaults()
    if (message) showToast(message)
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
    isDefaultModalOpen,
    setIsDefaultModalOpen,
    defaultRules,
    hierarchyNodes,
    handleDefaultRulesChanged,
    toast,
    hideToast,
    isPurchasing,
    purchaseSuccess,
    purchaseError,
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
