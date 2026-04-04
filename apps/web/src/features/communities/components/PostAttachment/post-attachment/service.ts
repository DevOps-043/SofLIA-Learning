interface AttachmentMetadata extends Record<string, unknown> {
  isMultiple?: boolean
  attachments?: unknown[]
  videoId?: string | null
}

export function isMultipleAttachmentData(attachmentData?: AttachmentMetadata) {
  return Boolean(
    attachmentData?.isMultiple &&
      attachmentData?.attachments &&
      Array.isArray(attachmentData.attachments),
  )
}

export function requiresAttachmentUrl(attachmentType: string) {
  return ['image', 'video', 'document', 'youtube', 'link'].includes(
    attachmentType,
  )
}

export function hasValidAttachmentUrl(attachmentUrl?: string) {
  return Boolean(attachmentUrl && attachmentUrl.trim() !== '')
}

export function extractYouTubeVideoId(attachmentUrl?: string, attachmentData?: AttachmentMetadata) {
  let videoId = attachmentData?.videoId

  if (!videoId && attachmentUrl) {
    const regex =
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    const match = attachmentUrl.match(regex)
    videoId = match ? match[1] : null
  }

  return videoId
}

export function buildYouTubeEmbedUrl(videoId?: string | null) {
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 Bytes'
  }

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
