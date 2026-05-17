'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { InviteLinksContent } from './manage-invite-links/InviteLinksContent'
import { InviteLinksFooter } from './manage-invite-links/InviteLinksFooter'
import { InviteLinksHeader } from './manage-invite-links/InviteLinksHeader'
import type { BusinessManageInviteLinksModalProps } from './manage-invite-links/invite-links.types'
import { useInviteLinksTheme } from './manage-invite-links/useInviteLinksTheme'
import { useManageInviteLinks } from './manage-invite-links/useManageInviteLinks'

export function BusinessManageInviteLinksModal({
  isOpen,
  onClose,
  onCreateNew,
  organizationSlug,
}: BusinessManageInviteLinksModalProps) {
  const params = useParams()
  const orgSlug = organizationSlug || (params?.orgSlug as string)
  const theme = useInviteLinksTheme()
  const state = useManageInviteLinks({ isOpen, orgSlug })

  if (!isOpen) return null

  const openCreateNew = () => {
    onClose()
    onCreateNew()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }} className="relative w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={event => event.stopPropagation()}>
          <div className="rounded-2xl shadow-2xl overflow-hidden border flex flex-col max-h-full" style={{ backgroundColor: theme.surfaceColor, borderColor: theme.borderColor }}>
            <InviteLinksHeader isLoading={state.isLoading} onClose={onClose} onRefresh={state.fetchLinks} />
            <InviteLinksContent onCreateNew={openCreateNew} state={state} />
            <InviteLinksFooter linksCount={state.links.length} onClose={onClose} onCreateNew={openCreateNew} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
