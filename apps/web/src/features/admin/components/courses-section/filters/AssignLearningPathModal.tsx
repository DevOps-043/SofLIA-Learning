'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { CompanyMember, LearningPath } from '../courses-section.types'
import { colors } from '../courses-section.types'
import { AssignSelectField } from './AssignSelectField'

interface AssignLearningPathModalProps {
  isOpen: boolean
  onClose: () => void
  members: CompanyMember[]
  learningPaths: LearningPath[]
  selectedUserForLearningPath: string | null
  setSelectedUserForLearningPath: (v: string | null) => void
  selectedLearningPathForUser: string | null
  setSelectedLearningPathForUser: (v: string | null) => void
  isAssigning: boolean
  onConfirm: () => void
}

export function AssignLearningPathModal({
  isOpen, onClose, members, learningPaths,
  selectedUserForLearningPath, setSelectedUserForLearningPath,
  selectedLearningPathForUser, setSelectedLearningPathForUser,
  isAssigning, onConfirm
}: AssignLearningPathModalProps) {
  const { t } = useTranslation('admin')
  const memberOptions = members.map(m => ({ id: m.user_id, label: m.user.display_name || m.user.email }))
  const pathOptions = learningPaths.map(path => ({ id: path.id, label: path.title }))

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border"
            style={{ backgroundColor: colors.bgSecondary, borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="p-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{t('coursesSection.assignPathTitle')}</h4>
              <p className="text-sm" style={{ color: colors.grayMedium }}>{t('coursesSection.assignPathSubtitle')}</p>
            </div>
            <div className="p-8 space-y-8">
              <AssignSelectField label={t('coursesSection.selectMember')} placeholder={t('coursesSection.memberPlaceholder')} value={selectedUserForLearningPath} onChange={setSelectedUserForLearningPath} options={memberOptions} />
              <AssignSelectField label={t('coursesSection.selectLearningPath')} placeholder={t('coursesSection.pathPlaceholder')} value={selectedLearningPathForUser} onChange={setSelectedLearningPathForUser} options={pathOptions} />
            </div>
            <div className="p-8 border-t flex gap-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <button onClick={onClose} className="flex-1 py-4 text-sm font-bold text-white/40 hover:text-white transition-all">{t('coursesSection.cancel')}</button>
              <button
                disabled={!selectedUserForLearningPath || !selectedLearningPathForUser || isAssigning}
                onClick={onConfirm}
                className="flex-[2] py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-30 shadow-xl"
                style={{ backgroundColor: colors.accent, color: colors.primary }}
              >
                {isAssigning ? t('coursesSection.assigning') : t('coursesSection.confirmAssignment')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
