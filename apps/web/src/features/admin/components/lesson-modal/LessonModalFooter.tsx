import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import type { TFunction } from 'i18next';

interface LessonModalFooterProps {
  loading: boolean;
  onClose: () => void;
  tc: TFunction<'common'>;
}

export function LessonModalFooter({ loading, onClose, tc }: LessonModalFooterProps) {
  return (
    <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-[#E9ECEF] bg-[#E9ECEF]/30 px-4 py-4 dark:border-[#6C757D]/30 dark:bg-[#0A0D12] sm:flex-row sm:items-center sm:justify-end sm:px-6">
      <motion.button type="button" onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full rounded-xl border border-[#E9ECEF] bg-white px-6 py-2.5 text-sm font-medium text-[#6C757D] transition-colors duration-200 hover:bg-[#E9ECEF] dark:border-[#6C757D]/30 dark:bg-[#1E2329] dark:text-white/70 dark:hover:bg-[#0A2540]/30 sm:w-auto" disabled={loading}>
        {tc('actions.cancel')}
      </motion.button>
      <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#0A2540]/20 transition-colors duration-200 hover:bg-[#0d2f4d] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto" disabled={loading}>
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{tc('actions.saving')}</span>
          </>
        ) : (
          <>
            <CheckCircleIcon className="h-4 w-4" />
            <span>{tc('actions.save')}</span>
          </>
        )}
      </motion.button>
    </div>
  );
}
