'use client'

import {
  ArrowPathIcon,
  CheckCircleIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { AdminButton, AdminSurface } from '../ui'

interface AdminPendingCourseActionBarProps {
  isRejected: boolean
  onApprove: () => void
  onDelete: () => void
  onReject: () => void
  onReconsider: () => void
}

export function AdminPendingCourseActionBar({
  isRejected,
  onApprove,
  onDelete,
  onReject,
  onReconsider,
}: AdminPendingCourseActionBarProps) {
  const { t } = useTranslation('admin')

  return (
    <AdminSurface className="sticky bottom-6 z-20 mt-8 p-4 backdrop-blur-md">
      <div className="flex flex-col justify-end gap-3 sm:flex-row">
        {isRejected ? (
          <>
            <AdminButton icon={TrashIcon} onClick={onDelete} variant="danger">
              {t('pendingCourseDetail.actions.delete')}
            </AdminButton>
            <AdminButton icon={ArrowPathIcon} onClick={onReconsider} variant="secondary">
              {t('pendingCourseDetail.actions.reconsider')}
            </AdminButton>
          </>
        ) : (
          <AdminButton icon={XCircleIcon} onClick={onReject} variant="danger">
            {t('pendingCourseDetail.actions.reject')}
          </AdminButton>
        )}

        <AdminButton icon={CheckCircleIcon} onClick={onApprove}>
          {isRejected ? t('pendingCourseDetail.actions.approve') : t('pendingCourseDetail.actions.approvePublish')}
        </AdminButton>
      </div>
    </AdminSurface>
  )
}
