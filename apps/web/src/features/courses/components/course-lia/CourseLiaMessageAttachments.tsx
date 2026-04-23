import type { SofLIAMessage } from '../../../../core/types/lia.types';

interface CourseLiaMessageAttachmentsProps {
  attachments: SofLIAMessage['attachments'];
  messageId: string;
}

export function CourseLiaMessageAttachments({
  attachments,
  messageId,
}: CourseLiaMessageAttachmentsProps) {
  if (!attachments?.length) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
      {attachments.map((attachment, attachmentIndex) => (
        <img
          key={`${messageId}-attachment-${attachmentIndex}`}
          src={attachment.dataUrl}
          alt={attachment.fileName}
          style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        />
      ))}
    </div>
  );
}
