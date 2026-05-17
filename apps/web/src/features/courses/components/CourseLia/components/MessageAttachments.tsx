import type { LiaImageAttachment } from '@/core/reporting/report-problem.contract';

interface MessageAttachmentsProps {
  attachments?: LiaImageAttachment[];
  messageId: string;
}

export function MessageAttachments({ attachments, messageId }: MessageAttachmentsProps) {
  if (!attachments?.length) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
      {attachments.map((attachment, index) => (
        <img
          key={`${messageId}-attachment-${index}`}
          src={attachment.dataUrl}
          alt={attachment.fileName}
          style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        />
      ))}
    </div>
  );
}
