import { AnimatePresence, motion } from 'framer-motion';

export function RegisterStatusMessage({ success }: { success: string | null }) {
  return (
    <AnimatePresence>
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4 p-3 rounded-xl bg-success/10 dark:bg-success/20 border border-success/30 text-success dark:text-success text-sm font-medium"
        >
          {success}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
