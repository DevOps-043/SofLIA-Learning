'use client'

import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import { CourseDetailService } from '../../services/course-detail.service'
import type { CourseDetailResponse } from '../../types/course-detail.types'

type UseCourseDetailPurchaseParams = {
  detail: CourseDetailResponse | null
  setDetail: Dispatch<SetStateAction<CourseDetailResponse | null>>
  slug: string
}

export function useCourseDetailPurchase({
  detail,
  setDetail,
  slug,
}: UseCourseDetailPurchaseParams) {
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const refreshPurchaseState = async () => {
    if (!slug) return

    const isPurchased = await CourseDetailService.getPurchaseState(slug)
    setDetail((previous) => (previous ? { ...previous, isPurchased } : previous))
  }

  const handlePurchase = async () => {
    if (!detail) return

    setIsPurchasing(true)

    try {
      const purchase = await CourseDetailService.purchaseCourse(slug)
      setSuccessMessage(`Curso "${purchase.data?.course_title || detail.course.title}" adquirido exitosamente`)
      setShowSuccessModal(true)
      setDetail((previous) => (previous ? { ...previous, isPurchased: true } : previous))
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

  return {
    errorMessage,
    handlePurchase,
    isPurchasing,
    refreshPurchaseState,
    setShowErrorModal,
    setShowSuccessModal,
    showErrorModal,
    showSuccessModal,
    successMessage,
  }
}
