import { motion } from 'framer-motion';
import { AcademicCapIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { TFunction } from 'i18next';

interface LessonModalHeaderProps {
  isEditing: boolean;
  onClose: () => void;
  t: TFunction<'admin'>;
}

export function LessonModalHeader({ isEditing, onClose, t }: LessonModalHeaderProps) {
  return (
    <div className="relative border-b border-primary/20 bg-gradient-to-r from-primary to-primary/90 px-4 py-4 dark:from-primary dark:to-primary/80 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <AcademicCapIcon className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {isEditing ? t('workshops.editor.lessons.editLesson') : t('workshops.editor.lessons.createLesson')}
            </h3>
            <p className="text-xs text-white/70">
              {isEditing ? t('workshops.editor.lessons.editLessonDesc') : t('workshops.editor.lessons.createLessonDesc')}
            </p>
          </div>
        </div>
        <motion.button onClick={onClose} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200">
          <XMarkIcon className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  );
}
