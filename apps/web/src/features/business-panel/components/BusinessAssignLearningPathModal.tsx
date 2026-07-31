'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { AssignmentBody } from './BusinessAssignLearningPathModal/AssignmentBody'
import { AssignmentControls } from './BusinessAssignLearningPathModal/AssignmentControls'
import { ModalFooter } from './BusinessAssignLearningPathModal/ModalFooter'
import { ModalHeader } from './BusinessAssignLearningPathModal/ModalHeader'
import { SummaryPanel } from './BusinessAssignLearningPathModal/SummaryPanel'
import type { BusinessAssignLearningPathModalProps } from './BusinessAssignLearningPathModal/types'
import { useAssignLearningPathModalState } from './BusinessAssignLearningPathModal/useAssignLearningPathModalState'
import modalStyles from './ContentModal.module.css'

export function BusinessAssignLearningPathModal(props: BusinessAssignLearningPathModalProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const state = useAssignLearningPathModalState({ ...props, t })
  const modalVariables = {
    '--modal-accent': theme.accentColor,
    '--modal-action': theme.actionColor,
    '--modal-on-action': theme.onActionColor,
    '--modal-card': theme.cardBg,
    '--modal-surface': theme.panelBg,
    '--modal-text': theme.textColor,
    '--modal-muted': theme.subtextColor,
    '--modal-border': theme.borderColor,
    '--modal-input': theme.inputBg,
    '--modal-divider': theme.dividerColor,
    '--modal-danger': theme.dangerColor,
  } as CSSProperties

  if (!props.isOpen || !props.learningPath) return null

  return (
    <AnimatePresence>
      <div className={modalStyles.overlay} onClick={props.onClose}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={modalStyles.backdrop} />
        <motion.div
          aria-labelledby="assign-learning-path-title"
          aria-modal="true"
          className={`${modalStyles.dialog} ${modalStyles.dialogWide}`}
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          style={modalVariables}
          transition={{ duration: 0.2 }}
        >
          <ModalHeader learningPath={props.learningPath} onClose={props.onClose} t={t} theme={theme} />
          <div className={modalStyles.bodyGrid}>
            <div className={modalStyles.mainPanel}>
              <AssignmentControls {...state} hierarchyNodes={props.hierarchyNodes} t={t} theme={theme} />
              <AssignmentBody {...state} isLoadingUsers={props.isLoadingUsers} t={t} theme={theme} />
            </div>
            <SummaryPanel existingAssignments={props.existingAssignments} learningPath={props.learningPath} t={t} theme={theme} />
          </div>
          <ModalFooter activeUserCount={state.activeUsers.length} assignmentMode={state.assignmentMode} handleAssign={state.handleAssign} isAssigning={state.isAssigning} onClose={props.onClose} selectedNodeIds={state.selectedNodeIds} selectedUserIds={state.selectedUserIds} t={t} theme={theme} />
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
