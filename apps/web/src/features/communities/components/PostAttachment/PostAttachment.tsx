'use client'

import { useState, memo } from 'react'
import { motion } from 'framer-motion'
import {
  hasValidAttachmentUrl,
  InteractivePoll,
  isMultipleAttachmentData,
  PostAttachmentRenderer,
  requiresAttachmentUrl,
} from './post-attachment'
import type { PostAttachmentProps } from './post-attachment'

export const PostAttachment = memo(function PostAttachment({
  attachmentType,
  attachmentUrl,
  attachmentData,
  className = '',
  postId,
  communitySlug,
}: PostAttachmentProps) {
  const [showImageModal, setShowImageModal] = useState(false)

  if (!attachmentType) {
    return null
  }

  if (isMultipleAttachmentData(attachmentData)) {
    return (
      <div className={`space-y-3 ${className}`}>
        {attachmentData.attachments.map((attachment: Record<string, unknown>, index: number) => (
          <PostAttachment
            key={index}
            attachmentType={attachment.attachment_type}
            attachmentUrl={attachment.attachment_url}
            attachmentData={attachment.attachment_data}
            postId={postId}
            communitySlug={communitySlug}
          />
        ))}
      </div>
    )
  }

  if (requiresAttachmentUrl(attachmentType) && !hasValidAttachmentUrl(attachmentUrl)) {
    return null
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`mt-3 ${className}`}
      >
        {attachmentType === 'poll' ? (
          <InteractivePoll
            attachmentData={attachmentData}
            postId={postId}
            communitySlug={communitySlug}
          />
        ) : (
          <PostAttachmentRenderer
            attachmentType={attachmentType}
            attachmentUrl={attachmentUrl as string}
            attachmentData={attachmentData}
            showImageModal={showImageModal}
            onOpenImage={() => setShowImageModal(true)}
            onCloseImage={() => setShowImageModal(false)}
          />
        )}
      </motion.div>
    </>
  )
})
