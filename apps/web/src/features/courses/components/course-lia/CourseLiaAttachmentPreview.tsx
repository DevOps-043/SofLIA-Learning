import { X } from 'lucide-react';

import type { LiaImageAttachment } from '../../../../core/reporting/report-problem.contract';
import type { CourseLiaThemeColors } from './CourseLia.types';

interface CourseLiaAttachmentPreviewProps {
  attachment: LiaImageAttachment | null;
  isLightTheme: boolean;
  onRemove: () => void;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaAttachmentPreview({
  attachment,
  isLightTheme,
  onRemove,
  themeColors,
}: CourseLiaAttachmentPreviewProps) {
  if (!attachment) {
    return null;
  }

  return (
    <div style={{ marginBottom: '10px', padding: '10px 12px', borderRadius: '16px', backgroundColor: isLightTheme ? '#F8FAFC' : 'rgba(255,255,255,0.04)', border: `1px solid ${themeColors.borderColor}`, display: 'flex', gap: '12px', alignItems: 'center' }}>
      <img src={attachment.dataUrl} alt={attachment.fileName} style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, color: themeColors.textPrimary, fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {attachment.fileName}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        style={{ width: '30px', height: '30px', borderRadius: '999px', border: 'none', background: isLightTheme ? '#E2E8F0' : '#1F2937', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isLightTheme ? '#475569' : '#CBD5E1' }}
      >
        <X style={{ width: '14px', height: '14px' }} />
      </button>
    </div>
  );
}
