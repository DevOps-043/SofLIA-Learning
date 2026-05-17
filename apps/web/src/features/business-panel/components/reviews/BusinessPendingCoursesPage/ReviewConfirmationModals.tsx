import { ConfirmationModal } from '@/features/admin/components/ConfirmationModal'
import type { ReviewTab, ReviewTranslator } from './types'

interface ReviewConfirmationModalsProps {
  activeTab: ReviewTab
  courseToApprove: string | null
  courseToDelete: string | null
  courseToReject: string | null
  tReviews: ReviewTranslator
  onApprove: () => Promise<void>
  onDelete: () => Promise<void>
  onReject: () => Promise<void>
  onApproveClose: () => void
  onDeleteClose: () => void
  onRejectClose: () => void
}

export function ReviewConfirmationModals({
  activeTab,
  courseToApprove,
  courseToDelete,
  courseToReject,
  tReviews,
  onApprove,
  onDelete,
  onReject,
  onApproveClose,
  onDeleteClose,
  onRejectClose,
}: ReviewConfirmationModalsProps) {
  const isReconsidering = activeTab === 'rejected'

  return (
    <>
      <ConfirmationModal
        isOpen={!!courseToApprove}
        onClose={onApproveClose}
        onConfirm={onApprove}
        title={isReconsidering ? tReviews('approveModal.reconsiderTitle') : tReviews('approveModal.approveTitle')}
        message={isReconsidering ? tReviews('approveModal.reconsiderMessage') : tReviews('approveModal.approveMessage')}
        confirmText={isReconsidering ? tReviews('approveModal.reconsiderConfirm') : tReviews('approveModal.approveConfirm')}
        cancelText={tReviews('actions.cancel')}
        type="success"
      />
      <ConfirmationModal
        isOpen={!!courseToReject}
        onClose={onRejectClose}
        onConfirm={onReject}
        title={tReviews('rejectModal.title')}
        message={tReviews('rejectModal.message')}
        confirmText={tReviews('rejectModal.confirm')}
        cancelText={tReviews('actions.cancel')}
        type="danger"
      />
      <ConfirmationModal
        isOpen={!!courseToDelete}
        onClose={onDeleteClose}
        onConfirm={onDelete}
        title={tReviews('deleteModal.title')}
        message={tReviews('deleteModal.message')}
        confirmText={tReviews('deleteModal.confirm')}
        cancelText={tReviews('actions.cancel')}
        type="danger"
      />
    </>
  )
}
