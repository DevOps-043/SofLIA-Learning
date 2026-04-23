import type { UploadedReportAttachment } from '@/core/reporting/report-problem.contract';

export function mergeUploadedAttachments(
  existingAttachments: UploadedReportAttachment[],
  newAttachments: UploadedReportAttachment[]
): UploadedReportAttachment[] {
  const deduplicated = new Map<string, UploadedReportAttachment>();

  [...existingAttachments, ...newAttachments].forEach((attachment) => {
    const key =
      attachment.storagePath ||
      `${attachment.fileName}-${attachment.size}-${attachment.publicUrl}`;
    deduplicated.set(key, attachment);
  });

  return Array.from(deduplicated.values());
}
