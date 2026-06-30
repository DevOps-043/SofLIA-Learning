'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { useBusinessInviteModalLogic } from '../hooks/useBusinessInviteModalLogic'
import type { BusinessInviteModalProps } from '../services/business-invite-modal.service'
import {
  BusinessInviteBulkTab,
  BusinessInviteIndividualTab,
  BusinessInviteManageTab,
  BusinessInviteModalHeader,
} from './business-invite-modal'

export function BusinessInviteModal({
  isOpen,
  onClose,
  onInviteSent,
  organizationId,
  organizationSlug,
  defaultTab = 'individual',
}: BusinessInviteModalProps) {
  const theme = useBusinessPanelTheme()
  const {
    activeTab,
    setActiveTab,
    tabs,
    individualForm,
    setIndividualForm,
    individualStatus,
    individualError,
    individualSuccess,
    handleIndividualSubmit,
    bulkForm,
    setBulkForm,
    bulkStatus,
    setBulkStatus,
    bulkError,
    createdLink,
    setCreatedLink,
    copied,
    handleBulkSubmit,
    links,
    linksLoading,
    linksError,
    setLinksError,
    copiedId,
    actionLoading,
    openMenuId,
    setOpenMenuId,
    fetchLinks,
    handleCopyLink,
    handleLinkAction,
    getInviteUrl,
    getStatusConfig,
    roleLabels,
  } = useBusinessInviteModalLogic({
    isOpen,
    onClose,
    onInviteSent,
    organizationId,
    organizationSlug,
    defaultTab,
  })

  if (!isOpen) {
    return null
  }

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
          className="relative flex max-h-[90vh] w-full max-w-2xl flex-col"
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className="flex max-h-full flex-col overflow-hidden rounded-2xl border shadow-2xl"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
            }}
          >
            <BusinessInviteModalHeader
              activeTab={activeTab}
              tabs={tabs}
              onClose={onClose}
              onTabChange={setActiveTab}
            />

            <div
              className="flex-1 overflow-y-auto"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: `${theme.borderColor} transparent`,
              }}
            >
              <AnimatePresence mode="wait">
                {activeTab === 'individual' && (
                  <motion.div
                    key="individual"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <BusinessInviteIndividualTab
                      form={individualForm}
                      setForm={setIndividualForm}
                      status={individualStatus}
                      error={individualError}
                      success={individualSuccess}
                      onSubmit={handleIndividualSubmit}
                      roleLabels={roleLabels}
                    />
                  </motion.div>
                )}

                {activeTab === 'bulk' && (
                  <motion.div
                    key="bulk"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <BusinessInviteBulkTab
                      form={bulkForm}
                      setForm={setBulkForm}
                      status={bulkStatus}
                      error={bulkError}
                      createdLink={createdLink}
                      copied={copied}
                      onSubmit={handleBulkSubmit}
                      onCopyLink={handleCopyLink}
                      onCreateAnother={() => {
                        setBulkStatus('idle')
                        setCreatedLink(null)
                      }}
                      onGoToManage={() => setActiveTab('manage')}
                      getInviteUrl={getInviteUrl}
                      roleLabels={roleLabels}
                    />
                  </motion.div>
                )}

                {activeTab === 'manage' && (
                  <motion.div
                    key="manage"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <BusinessInviteManageTab
                      links={links}
                      linksLoading={linksLoading}
                      linksError={linksError}
                      copiedId={copiedId}
                      actionLoading={actionLoading}
                      openMenuId={openMenuId}
                      roleLabels={roleLabels}
                      getInviteUrl={getInviteUrl}
                      getStatusConfig={getStatusConfig}
                      onDismissError={() => setLinksError(null)}
                      onRefresh={fetchLinks}
                      onCopyLink={handleCopyLink}
                      onAction={handleLinkAction}
                      onCreateLink={() => setActiveTab('bulk')}
                      onToggleMenu={setOpenMenuId}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {openMenuId && (
          <div
            className="fixed inset-0"
            style={{ zIndex: 99998 }}
            onClick={() => setOpenMenuId(null)}
          />
        )}
      </div>
    </AnimatePresence>
  )
}
