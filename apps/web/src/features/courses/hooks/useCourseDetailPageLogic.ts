'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import {
  buildCourseDetailSummary,
  getInitialExpandedModuleIds,
} from '../services/course-detail-display.service'
import { CourseDetailService } from '../services/course-detail.service'
import type { CourseDetailResponse, CourseDetailTabId } from '../types/course-detail.types'

export function useCourseDetailPageLogic() {
  const params = useParams()
  const router = useRouter()
  const { i18n } = useTranslation()
  const slug = params.slug as string

  const [detail, setDetail] = useState<CourseDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<CourseDetailTabId>('info')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadCourseDetail() {
      if (!slug) {
        return
      }

      try {
        setLoading(true)
        setError(null)

        const nextDetail = await CourseDetailService.getCourseDetail(slug, i18n.language || 'es')
        setDetail(nextDetail)
        setExpandedModules(new Set(getInitialExpandedModuleIds(nextDetail.modules)))
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Error al cargar el curso')
      } finally {
        setLoading(false)
      }
    }

    void loadCourseDetail()
  }, [i18n.language, slug])

  const summary = useMemo(() => {
    return buildCourseDetailSummary(detail?.modules || [], detail?.course.estimatedDuration)
  }, [detail])

  const refreshPurchaseState = async () => {
    if (!slug) {
      return
    }

    const isPurchased = await CourseDetailService.getPurchaseState(slug)
    setDetail(previous => previous ? { ...previous, isPurchased } : previous)
  }

  const handlePurchase = async () => {
    if (!detail) {
      return
    }

    setIsPurchasing(true)

    try {
      const purchase = await CourseDetailService.purchaseCourse(slug)
      setSuccessMessage(`Curso "${purchase.data?.course_title || detail.course.title}" adquirido exitosamente`)
      setShowSuccessModal(true)
      setDetail(previous => previous ? { ...previous, isPurchased: true } : previous)
      window.setTimeout(() => {
        void refreshPurchaseState()
      }, 500)
    } catch (purchaseError) {
      setErrorMessage(purchaseError instanceof Error ? purchaseError.message : 'Error al adquirir el curso')
      setShowErrorModal(true)
    } finally {
      setIsPurchasing(false)
    }
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules(previous => {
      const next = new Set(previous)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }

      return next
    })
  }

  return {
    slug,
    loading,
    error,
    activeTab,
    setActiveTab,
    expandedModules,
    detail,
    summary,
    isPurchasing,
    showSuccessModal,
    successMessage,
    showErrorModal,
    errorMessage,
    setShowSuccessModal,
    setShowErrorModal,
    handlePurchase,
    toggleModule,
    refreshPurchaseState,
    goBack: () => router.back(),
    goToLearn: () => router.push(`/courses/${slug}/learn`)
  }
}
