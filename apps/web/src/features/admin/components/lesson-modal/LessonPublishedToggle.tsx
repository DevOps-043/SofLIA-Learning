import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import type { TFunction } from 'i18next';

interface LessonPublishedToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  t: TFunction<'admin'>;
}

export function LessonPublishedToggle({ checked, onChange, t }: LessonPublishedToggleProps) {
  return (
    <motion.div whileHover={{ scale: 1.01 }} className="p-4 bg-gray-200/50 dark:bg-carbon-950 rounded-xl border border-gray-200 dark:border-gray-500/30">
      <label className="flex items-center gap-3 cursor-pointer">
        <div className="relative">
          <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
          <motion.div animate={{ backgroundColor: checked ? 'var(--color-accent)' : 'var(--color-gray-200)', borderColor: checked ? 'var(--color-accent)' : 'var(--color-gray-200)' }} className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200">
            {checked && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                <CheckCircleIcon className="h-4 w-4 text-white" />
              </motion.div>
            )}
          </motion.div>
        </div>
        <div>
          <span className="text-sm font-medium text-primary dark:text-white">{t('workshops.editor.lessons.publishedLabel')}</span>
          <p className="text-xs text-gray-500 dark:text-white/60 mt-0.5">{t('workshops.editor.lessons.publishedDesc')}</p>
        </div>
      </label>
    </motion.div>
  );
}
