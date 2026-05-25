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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-gray-200 bg-gradient-to-r from-gray-200/30 via-gray-200/20 to-gray-200/30 px-4 py-4 dark:border-gray-500/30 dark:from-carbon-950 dark:via-carbon-950/50 dark:to-carbon-950 sm:flex-row sm:items-center sm:justify-end sm:px-6">
      <motion.button type="button" onClick={onClose} whileHover={{ scale: 1.02, x: -2 }} whileTap={{ scale: 0.98 }} className="w-full rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-500 shadow-sm transition-all duration-200 hover:bg-gray-200 hover:shadow-md dark:border-gray-500/30 dark:bg-carbon-800 dark:text-white/70 dark:hover:bg-primary/30 sm:w-auto" disabled={loading}>
        {tc('actions.cancel')}
      </motion.button>
      <motion.button type="submit" whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/90 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all duration-200 hover:from-primary hover:to-primary hover:shadow-xl hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto" disabled={loading}>
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
