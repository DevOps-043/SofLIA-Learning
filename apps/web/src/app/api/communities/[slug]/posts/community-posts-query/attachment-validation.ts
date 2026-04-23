import { logger } from '@/lib/utils/logger';

const VALID_ATTACHMENT_TYPES = ['image', 'video', 'document', 'link', 'poll'];

export function validateAttachmentType(
  attachmentType: string | undefined
): string | null | undefined {
  if (!attachmentType) return attachmentType;
  if (VALID_ATTACHMENT_TYPES.includes(attachmentType)) return attachmentType;

  logger.warn('Invalid attachment_type received:', attachmentType, 'Defaulting to null');
  return null;
}

export function validateAttachmentData(
  attachmentData: Record<string, unknown> | string | null | undefined
): Record<string, unknown> | null | undefined {
  if (!attachmentData) return attachmentData as null | undefined;

  try {
    const parsedData =
      typeof attachmentData === 'string'
        ? (JSON.parse(attachmentData) as Record<string, unknown>)
        : attachmentData;

    if (typeof parsedData !== 'object') {
      logger.warn('Invalid attachment_data type:', typeof parsedData, 'Defaulting to null');
      return null;
    }

    // Verify the object is fully serializable before trusting it.
    // Throws if parsedData contains functions, circular refs, or non-serializable values.
    JSON.stringify(parsedData);
    return parsedData;
  } catch (error) {
    logger.error('Error validating attachment_data:', error);
    return null;
  }
}
