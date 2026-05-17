'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { AssignmentBody } from './BusinessAssignLearningPathModal/AssignmentBody'
import { AssignmentControls } from './BusinessAssignLearningPathModal/AssignmentControls'
import { ModalFooter } from './BusinessAssignLearningPathModal/ModalFooter'
import { ModalHeader } from './BusinessAssignLearningPathModal/ModalHeader'
import { SummaryPanel } from './BusinessAssignLearningPathModal/SummaryPanel'
import type { BusinessAssignLearningPathModalProps } from './BusinessAssignLearningPathModal/types'
import { useAssignLearningPathModalState } from './BusinessAssignLearningPathModal/useAssignLearningPathModalState'

export function BusinessAssignLearningPathModal(props: BusinessAssignLearningPathModalProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const state = useAssignLearningPathModalState({ ...props, t })

  if (!props.isOpen || !props.learningPath) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={props.onClose}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: theme.overlayBg }} />
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }} transition={{ duration: 0.2 }} className="relative z-10 flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border shadow-2xl" style={{ backgroundColor: theme.panelBg, borderColor: theme.borderColor }} onClick={(event) => event.stopPropagation()}>
          <ModalHeader learningPath={props.learningPath} onClose={props.onClose} t={t} theme={theme} />
          <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[1.35fr,0.85fr]">
            <div className="flex min-h-0 flex-col border-r" style={{ borderColor: theme.borderColor }}>
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
