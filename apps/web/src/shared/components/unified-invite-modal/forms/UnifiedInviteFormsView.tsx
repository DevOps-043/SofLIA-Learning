'use client';

import { BulkInviteForm } from './BulkInviteForm';
import { IndividualInviteForm } from './IndividualInviteForm';
import type { FormsViewProps } from './types';

export function UnifiedInviteFormsView({ controller, mode, onClose, theme }: FormsViewProps) {
  if (mode === 'individual') {
    return <IndividualInviteForm controller={controller} onClose={onClose} theme={theme} />;
  }

  return <BulkInviteForm controller={controller} onClose={onClose} theme={theme} />;
}
