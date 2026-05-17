import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import type { TFunction } from 'i18next';

interface ModuleModalFooterProps {
  loading: boolean;
  onClose: () => void;
  tc: TFunction<'common'>;
}

export function ModuleModalFooter({ loading, onClose, tc }: ModuleModalFooterProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-[#E9ECEF] bg-gradient-to-r from-[#E9ECEF]/30 via-[#E9ECEF]/20 to-[#E9ECEF]/30 px-4 py-4 dark:border-[#6C757D]/30 dark:from-[#0A0D12] dark:via-[#0A0D12]/50 dark:to-[#0A0D12] sm:flex-row sm:items-center sm:justify-end sm:px-6">
      <motion.button type="button" onClick={onClose} whileHover={{ scale: 1.02, x: -2 }} whileTap={{ scale: 0.98 }} className="w-full rounded-xl border border-[#E9ECEF] bg-white px-6 py-2.5 text-sm font-medium text-[#6C757D] shadow-sm transition-all duration-200 hover:bg-[#E9ECEF] hover:shadow-md dark:border-[#6C757D]/30 dark:bg-[#1E2329] dark:text-white/70 dark:hover:bg-[#0A2540]/30 sm:w-auto" disabled={loading}>
        {tc('actions.cancel')}
      </motion.button>
      <motion.button type="submit" whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0A2540]/20 transition-all duration-200 hover:from-[#0d2f4d] hover:to-[#0A2540] hover:shadow-xl hover:shadow-[#0A2540]/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto" disabled={loading}>
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
            <span className="relative z-10">{tc('actions.saving')}</span>
          </>
        ) : (
          <>
            <CheckCircleIcon className="h-4 w-4 relative z-10" />
            <span className="relative z-10">{tc('actions.save')}</span>
          </>
        )}
      </motion.button>
    </motion.div>
  );
}
