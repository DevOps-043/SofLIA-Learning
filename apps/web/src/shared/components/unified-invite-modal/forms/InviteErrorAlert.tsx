import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export function InviteErrorAlert({ error }: { error?: string | null }) {
  if (!error) return null;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4"
      initial={{ opacity: 0, y: -10 }}
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
      <span className="flex-1 text-[11px] font-black uppercase text-red-400">{error}</span>
    </motion.div>
  );
}
