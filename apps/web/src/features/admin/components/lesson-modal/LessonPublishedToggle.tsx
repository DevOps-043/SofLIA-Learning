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
    <motion.div whileHover={{ scale: 1.01 }} className="p-4 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30">
      <label className="flex items-center gap-3 cursor-pointer">
        <div className="relative">
          <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
          <motion.div animate={{ backgroundColor: checked ? '#00D4B3' : '#E9ECEF', borderColor: checked ? '#00D4B3' : '#E9ECEF' }} className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200">
            {checked && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                <CheckCircleIcon className="h-4 w-4 text-white" />
              </motion.div>
            )}
          </motion.div>
        </div>
        <div>
          <span className="text-sm font-medium text-[#0A2540] dark:text-white">{t('workshops.editor.modules.publishedLabel')}</span>
          <p className="text-xs text-[#6C757D] dark:text-white/60 mt-0.5">{t('workshops.editor.modules.publishedDesc')}</p>
        </div>
      </label>
    </motion.div>
  );
}
