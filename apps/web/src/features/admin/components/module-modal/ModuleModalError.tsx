import { motion } from 'framer-motion';

export function ModuleModalError({ error }: { error: string | null }) {
  if (!error) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 dark:border-red-500/30 rounded-xl">
      <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
    </motion.div>
  );
}
