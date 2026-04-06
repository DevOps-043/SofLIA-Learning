'use client'

import { InlineAttachmentButtons } from '../InlineAttachmentButtons'
import { AttachmentPreview } from '../AttachmentPreview'
import { YouTubeLinkModal } from '../AttachmentModals'
import { PollModal } from '../AttachmentModals'
import type {
  InlineAttachmentPayload,
  InlineAttachmentTypeId,
} from '../InlineAttachmentButtons/InlineAttachmentButtons'
import type { PollAttachmentData } from '../AttachmentModals/PollModal'

interface DraftAttachment {
  type: InlineAttachmentTypeId
  data: InlineAttachmentPayload
  id: string
}

interface AttachmentPanelProps {
  postAttachments: DraftAttachment[]
  showYouTubeModal: boolean
  showPollModal: boolean
  pendingAttachmentType: 'youtube' | 'link' | null
  isSaving: boolean
  isProcessingAttachment: boolean
  onAttachmentSelect: (type: InlineAttachmentTypeId, data: InlineAttachmentPayload | null) => void
  onRemoveAttachment: (id: string) => void
  onYouTubeModalClose: () => void
  onYouTubeLinkConfirm: (url: string, type: 'youtube' | 'link') => void
  onPollModalClose: () => void
  onPollConfirm: (pollData: PollAttachmentData) => void
}

export function AttachmentPanel({
  postAttachments,
  showYouTubeModal,
  showPollModal,
  pendingAttachmentType,
  isSaving,
  isProcessingAttachment,
  onAttachmentSelect,
  onRemoveAttachment,
  onYouTubeModalClose,
  onYouTubeLinkConfirm,
  onPollModalClose,
  onPollConfirm,
}: AttachmentPanelProps) {
  return (
    <>
      {/* Preview de adjuntos */}
      {postAttachments.length > 0 && (
        <div className="space-y-2">
          {postAttachments.map((attachment) => (
            <AttachmentPreview
              key={attachment.id}
              type={attachment.type}
              data={attachment.data}
              onRemove={() => onRemoveAttachment(attachment.id)}
            />
          ))}
        </div>
      )}

      {/* Botones de adjuntos */}
      <div>
        <InlineAttachmentButtons
          onAttachmentSelect={onAttachmentSelect}
          currentAttachmentsCount={postAttachments.length}
          maxAttachments={3}
        />
      </div>

      {/* Modales de adjuntos - con z-index alto para que aparezcan sobre el modal de edición */}
      {showYouTubeModal && (
        <div style={{ zIndex: 100000, position: 'fixed' }}>
          <YouTubeLinkModal
            isOpen={showYouTubeModal}
            onClose={onYouTubeModalClose}
            onConfirm={onYouTubeLinkConfirm}
            type={pendingAttachmentType || 'link'}
          />
        </div>
      )}

      {showPollModal && (
        <div style={{ zIndex: 100000, position: 'fixed' }}>
          <PollModal
            isOpen={showPollModal}
            onClose={onPollModalClose}
            onConfirm={onPollConfirm}
          />
        </div>
      )}
    </>
  )
}
