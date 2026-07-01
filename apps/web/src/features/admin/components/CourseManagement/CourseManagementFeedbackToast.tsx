'use client'

import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'
import { useCourseManagementContext } from './CourseManagementContext'

export function CourseManagementFeedbackToast() {
  const { state: { feedbackMessage, clearFeedbackMessage } } = useCourseManagementContext()

  return (
    <ToastNotification
      isOpen={!!feedbackMessage}
      onClose={clearFeedbackMessage}
      message={feedbackMessage?.message ?? ''}
      type={feedbackMessage?.type === 'success' ? 'success' : 'error'}
      position="top-right"
    />
  )
}
