import { motion } from 'framer-motion';
import { AcademicCapIcon } from '@heroicons/react/24/outline';
import type { Dispatch, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import { InstructorSelect } from './InstructorSelect';
import { LessonPublishedToggle } from './LessonPublishedToggle';
import type { InstructorOption, LessonFormData } from './types';

interface LessonBasicTabProps {
  formData: LessonFormData;
  instructors: InstructorOption[];
  setFormData: Dispatch<SetStateAction<LessonFormData>>;
  t: TFunction<'admin'>;
}

export function LessonBasicTab({ formData, instructors, setFormData, t }: LessonBasicTabProps) {
  return (
    <motion.div key="basic" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-4">
      <div className="group">
        <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
          {t('workshops.editor.lessons.lessonTitleLabel')}
        </label>
        <div className="relative">
          <AcademicCapIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-white/60 group-focus-within:text-accent transition-colors" />
          <input
            type="text"
            required
            value={formData.lesson_title}
            onChange={(event) => setFormData((current) => ({ ...current, lesson_title: event.target.value }))}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200"
            placeholder={t('workshops.editor.lessons.lessonTitlePlaceholder')}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
          {t('workshops.editor.lessons.lessonDescriptionLabel')}
        </label>
        <textarea
          rows={3}
          value={formData.lesson_description}
          onChange={(event) => setFormData((current) => ({ ...current, lesson_description: event.target.value }))}
          className="w-full px-4 py-2.5 bg-white dark:bg-carbon-950 border border-gray-200 dark:border-gray-500/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200 resize-none"
          placeholder={t('workshops.editor.lessons.lessonDescriptionPlaceholder')}
        />
      </div>
      <InstructorSelect value={formData.instructor_id} onChange={(instructorId) => setFormData((current) => ({ ...current, instructor_id: instructorId }))} instructors={instructors} />
      <LessonPublishedToggle checked={formData.is_published} onChange={(isPublished) => setFormData((current) => ({ ...current, is_published: isPublished }))} t={t} />
    </motion.div>
  );
}
