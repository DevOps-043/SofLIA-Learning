'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

import { buildCourseDetailSummary } from '../services/course-detail-display.service'
import { toggleExpandedModuleId } from './course-detail-page/toggleExpandedModuleId'
import { useCourseDetailData } from './course-detail-page/useCourseDetailData'
import { useCourseDetailPurchase } from './course-detail-page/useCourseDetailPurchase'

export function useCourseDetailPageLogic() {
  const params = useParams()
  const router = useRouter()
  const { i18n } = useTranslation()
  const slug = params.slug as string
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'reviews'>('info')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const detailState = useCourseDetailData({
    language: i18n.language || 'es',
    setExpandedModules,
    slug,
  })
  const purchase = useCourseDetailPurchase({
    detail: detailState.detail,
    setDetail: detailState.setDetail,
    slug,
  })

  const summary = useMemo(() => {
    return buildCourseDetailSummary(
      detailState.detail?.modules || [],
      detailState.detail?.course.estimatedDuration,
    )
  }, [detailState.detail])

  return {
    slug,
    loading: detailState.loading,
    error: detailState.error,
    activeTab,
    setActiveTab,
    expandedModules,
    detail: detailState.detail,
    summary,
    isPurchasing: purchase.isPurchasing,
    showSuccessModal: purchase.showSuccessModal,
    successMessage: purchase.successMessage,
    showErrorModal: purchase.showErrorModal,
    errorMessage: purchase.errorMessage,
    setShowSuccessModal: purchase.setShowSuccessModal,
    setShowErrorModal: purchase.setShowErrorModal,
    handlePurchase: purchase.handlePurchase,
    toggleModule: (moduleId: string) => setExpandedModules(toggleExpandedModuleId(moduleId)),
    refreshPurchaseState: purchase.refreshPurchaseState,
    goBack: () => router.back(),
    goToLearn: () => router.push(`/courses/${slug}/learn`),
  }
}
