'use client'

import { BulkInviteError } from './BulkInviteError'
import { BulkInviteFields } from './BulkInviteFields'
import { BulkInviteFooter } from './BulkInviteFooter'
import { BulkInviteInfoNote } from './BulkInviteInfoNote'
import { BulkInviteRolePicker } from './BulkInviteRolePicker'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { useBusinessBulkInviteLinkModal } from './useBusinessBulkInviteLinkModal'

interface BulkInviteFormProps {
  state: ReturnType<typeof useBusinessBulkInviteLinkModal>
  onClose: () => void
}

export function BulkInviteForm({ state, onClose }: BulkInviteFormProps) {
  const theme = useBusinessPanelTheme()

  return (
    <form onSubmit={state.handleSubmit} className="flex flex-col overflow-hidden h-full">
      <div
        className="flex-1 overflow-y-auto p-6 space-y-5"
        style={{ scrollbarWidth: 'thin', scrollbarColor: `${theme.borderColor} transparent` }}
      >
        <BulkInviteError error={state.error} onDismiss={() => state.setError(null)} />
        <BulkInviteFields formData={state.formData} status={state.status} onChange={state.handleChange} />
        <BulkInviteRolePicker
          role={state.formData.role}
          roleLabels={state.roleLabels}
          status={state.status}
          onRoleChange={role => state.setFormData(prev => ({ ...prev, role }))}
        />
        <BulkInviteInfoNote />
      </div>
      <BulkInviteFooter status={state.status} onClose={onClose} />
    </form>
  )
}
