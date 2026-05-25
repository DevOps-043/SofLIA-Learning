'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  LessonBasicTab,
  LessonContentTab,
  LessonModalError,
  LessonModalFooter,
  LessonModalHeader,
  LessonModalShell,
  LessonModalTabs,
  LessonVideoTab,
  type LessonModalProps,
  useLessonModalState,
} from './lesson-modal';

export function LessonModal({ instructors = [], lesson, moduleId: _moduleId, onClose, onSave }: LessonModalProps) {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation('common');
  const lessonState = useLessonModalState({ instructors, lesson, moduleId: _moduleId, onClose, onSave, t });

  return (
    <LessonModalShell onClose={onClose}>
      <LessonModalHeader isEditing={Boolean(lesson)} onClose={onClose} t={t} />
      <LessonModalTabs activeTab={lessonState.activeTab} setActiveTab={lessonState.setActiveTab} t={t} />
      <form onSubmit={lessonState.handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <LessonModalError error={lessonState.error} />
          <AnimatePresence mode="wait">
            {lessonState.activeTab === 'basic' && (
              <LessonBasicTab formData={lessonState.formData} instructors={instructors} setFormData={lessonState.setFormData} t={t} />
            )}
            {lessonState.activeTab === 'video' && (
              <motion.div key="video" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                <LessonVideoTab
                  durationAutoDetected={lessonState.durationAutoDetected}
                  formData={lessonState.formData}
                  onDurationAutoDetectedChange={lessonState.setDurationAutoDetected}
                  onFormDataChange={lessonState.setFormData}
                  onGenerateAI={lessonState.handleGenerateAI}
                />
              </motion.div>
            )}
            {lessonState.activeTab === 'content' && (
              <motion.div key="content" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                <LessonContentTab
                  formData={lessonState.formData}
                  generatingAI={lessonState.generatingAI}
                  onFormDataChange={lessonState.setFormData}
                  onGenerateAI={() => lessonState.handleGenerateAI()}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <LessonModalFooter loading={lessonState.loading} onClose={onClose} tc={tc} />
      </form>
    </LessonModalShell>
  );
}
