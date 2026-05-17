import { logger } from '@/lib/utils/logger'

export function validateAttachmentType(
  attachment_type: string | undefined,
): string | null | undefined {
  const validAttachmentTypes = ['image', 'video', 'document', 'link', 'poll']

  if (attachment_type && !validAttachmentTypes.includes(attachment_type)) {
    logger.warn('Invalid attachment_type received:', attachment_type, 'Defaulting to null')
    return null
  }

  return attachment_type
}

export function validateAttachmentData(
  attachment_data: Record<string, unknown> | string | null | undefined,
): Record<string, unknown> | null | undefined {
  if (!attachment_data) return attachment_data as null | undefined

  try {
    if (typeof attachment_data === 'string') {
      return JSON.parse(attachment_data) as Record<string, unknown>
    }

    if (typeof attachment_data !== 'object') {
      logger.warn('Invalid attachment_data type:', typeof attachment_data, 'Defaulting to null')
      return null
    }

    JSON.stringify(attachment_data)
    return attachment_data
  } catch (error) {
    logger.error('Error validating attachment_data:', error)
    return null
  }
}
