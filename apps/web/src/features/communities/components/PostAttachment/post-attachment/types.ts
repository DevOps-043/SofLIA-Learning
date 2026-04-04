export interface PostAttachmentProps {
  attachmentType: string
  attachmentUrl?: string
  attachmentData?: Record<string, unknown>
  className?: string
  postId?: string
  communitySlug?: string
}
