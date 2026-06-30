'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { BulkInviteForm } from './bulk-invite-link/BulkInviteForm'
import { BulkInviteHeader } from './bulk-invite-link/BulkInviteHeader'
import { BulkInviteSuccess } from './bulk-invite-link/BulkInviteSuccess'
import { useBusinessBulkInviteLinkModal } from './bulk-invite-link/useBusinessBulkInviteLinkModal'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'

interface BusinessBulkInviteLinkModalProps {
  isOpen: boolean
  onClose: () => void
  onLinkCreated?: () => void
  organizationSlug?: string
}

export function BusinessBulkInviteLinkModal({
  isOpen,
  onClose,
  onLinkCreated,
  organizationSlug,
}: BusinessBulkInviteLinkModalProps) {
  const theme = useBusinessPanelTheme()
  const state = useBusinessBulkInviteLinkModal({ isOpen, onLinkCreated, organizationSlug })

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg max-h-[90vh] flex flex-col"
          onClick={event => event.stopPropagation()}
        >
          <div
            className="rounded-2xl shadow-2xl overflow-hidden border flex flex-col max-h-full"
            style={{ backgroundColor: theme.panelBg, borderColor: theme.borderColor }}
          >
            <BulkInviteHeader onClose={onClose} />
            {state.status === 'success' && state.createdLink ? (
              <BulkInviteSuccess
                createdLink={state.createdLink}
                inviteUrl={state.getInviteUrl()}
                copied={state.copied}
                roleLabels={state.roleLabels}
                onClose={onClose}
                onCopy={state.handleCopy}
                onCreateAnother={state.resetCreatedLink}
              />
            ) : (
              <BulkInviteForm state={state} onClose={onClose} />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
