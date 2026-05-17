'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { CompanyMember, LearningPath } from '../courses-section.types'
import { colors } from '../courses-section.types'

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
  isOpen,
  onClose,
  members,
  learningPaths,
  selectedUserForLearningPath,
  setSelectedUserForLearningPath,
  selectedLearningPathForUser,
  setSelectedLearningPathForUser,
  isAssigning,
  onConfirm,
}: AssignLearningPathModalProps) {
  const { t } = useTranslation('admin')

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border" style={{ backgroundColor: colors.bgSecondary, borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="p-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{t('coursesSection.assignPathTitle')}</h4>
              <p className="text-sm" style={{ color: colors.grayMedium }}>{t('coursesSection.assignPathSubtitle')}</p>
            </div>
            <div className="p-8 space-y-8">
              <PathSelect label={t('coursesSection.selectMember')} value={selectedUserForLearningPath || ''} onChange={setSelectedUserForLearningPath}>
                <option value="">{t('coursesSection.memberPlaceholder')}</option>
                {members.map(member => (
                  <option key={member.user_id} value={member.user_id}>{member.user.display_name || member.user.email}</option>
                ))}
              </PathSelect>
              <PathSelect label={t('coursesSection.selectLearningPath')} value={selectedLearningPathForUser || ''} onChange={setSelectedLearningPathForUser}>
                <option value="">{t('coursesSection.pathPlaceholder')}</option>
                {learningPaths.map(path => (
                  <option key={path.id} value={path.id}>{path.title}</option>
                ))}
              </PathSelect>
            </div>
            <div className="p-8 border-t flex gap-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <button onClick={onClose} className="flex-1 py-4 text-sm font-bold text-white/40 hover:text-white transition-all">{t('coursesSection.cancel')}</button>
              <button disabled={!selectedUserForLearningPath || !selectedLearningPathForUser || isAssigning} onClick={onConfirm} className="flex-[2] py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-30 shadow-xl" style={{ backgroundColor: colors.accent, color: colors.primary }}>
                {isAssigning ? t('coursesSection.assigning') : t('coursesSection.confirmAssignment')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface PathSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}

function PathSelect({ label, value, onChange, children }: PathSelectProps) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.grayMedium }}>{label}</label>
      <div className="relative group">
        <select className="w-full h-14 pl-5 pr-10 rounded-2xl bg-black/20 border-white/5 border text-white text-sm appearance-none outline-none focus:ring-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }} value={value} onChange={event => onChange(event.target.value)}>
          {children}
        </select>
        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
      </div>
    </div>
  )
}
