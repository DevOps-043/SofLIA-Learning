import { AnimatePresence, motion } from 'framer-motion';

export function RegisterStatusMessage({ success }: { success: string | null }) {
  return (
    <AnimatePresence>
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4 p-3 rounded-xl bg-[#10B981]/10 dark:bg-[#10B981]/20 border border-[#10B981]/30 text-[#10B981] dark:text-[#10B981] text-sm font-medium"
        >
          {success}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
