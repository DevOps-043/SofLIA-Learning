'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ConfirmModal } from './HierarchySettings/ConfirmModal'
import { HierarchyErrorBanner } from './HierarchySettings/HierarchyErrorBanner'
import { HierarchyLoadingState } from './HierarchySettings/HierarchyLoadingState'
import { HierarchyOverviewCard } from './HierarchySettings/HierarchyOverviewCard'
import { RolesSection } from './HierarchySettings/RolesSection'
import { UserBehaviorSettings } from './HierarchySettings/UserBehaviorSettings'
import { useHierarchySettings } from './HierarchySettings/useHierarchySettings'
import styles from './HierarchyExperience.module.css'

export function HierarchySettings() {
  const { t } = useTranslation('business')
  const state = useHierarchySettings()

  if (state.isInitialLoading) {
    return <HierarchyLoadingState />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={styles.settingsStack}
    >
      <HierarchyErrorBanner
        error={state.error || state.actionError}
        onClose={state.clearVisibleErrors}
      />
      <HierarchyOverviewCard
        canEnableHierarchy={state.canEnableHierarchy}
        hasStructure={state.hasStructure}
        hasUnassignedUsers={state.hasUnassignedUsers}
        isHierarchyEnabled={state.isHierarchyEnabled}
        isLoading={state.isLoading}
        onCreateStructure={state.handleCreateStructure}
        onRequestDisable={() => state.setShowConfirmDisable(true)}
        onRequestEnable={() => state.setShowConfirmEnable(true)}
        stats={state.stats}
      />
      <UserBehaviorSettings config={state.config} updateConfig={state.updateConfig} />
      <RolesSection />
      {state.showConfirmEnable ? (
        <ConfirmModal
          title={t('hierarchy.enableTitle')}
          message={t('hierarchy.enableMessage')}
          confirmLabel={t('hierarchy.confirmEnable')}
          confirmVariant="success"
          onConfirm={state.handleEnableHierarchy}
          onCancel={() => state.setShowConfirmEnable(false)}
          isLoading={state.isLoading}
        />
      ) : null}
      {state.showConfirmDisable ? (
        <ConfirmModal
          title={t('hierarchy.disableTitle')}
          message={t('hierarchy.disableMessage')}
          confirmLabel={t('hierarchy.confirmDisable')}
          confirmVariant="danger"
          onConfirm={state.handleDisableHierarchy}
          onCancel={() => state.setShowConfirmDisable(false)}
          isLoading={state.isLoading}
        />
      ) : null}
    </motion.div>
  )
}

export default HierarchySettings
