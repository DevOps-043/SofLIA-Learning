import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface ModuleToggleCardProps {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}

export function ModuleToggleCard({ checked, description, label, onChange }: ModuleToggleCardProps) {
  return (
    <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} className="group relative p-4 bg-gradient-to-br from-gray-200/50 to-gray-200/30 dark:from-carbon-950 dark:to-carbon-950/50 rounded-xl border border-gray-200 dark:border-gray-500/30 hover:border-accent/30 dark:hover:border-accent/30 transition-all duration-300 cursor-pointer overflow-hidden">
      <motion.div className="absolute inset-0 bg-gradient-to-r from-accent/0 to-accent/0 group-hover:from-accent/5 group-hover:to-accent/0" transition={{ duration: 0.3 }} />
      <label className="relative flex items-center gap-3 cursor-pointer">
        <div className="relative">
          <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
          <motion.div animate={{ backgroundColor: checked ? 'var(--color-accent)' : 'var(--color-gray-200)', borderColor: checked ? 'var(--color-accent)' : 'var(--color-gray-200)', scale: checked ? 1 : 0.95 }} className="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 shadow-sm">
            {checked && (
              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                <CheckCircleIcon className="h-4 w-4 text-white" />
              </motion.div>
            )}
          </motion.div>
        </div>
        <div>
          <span className="text-sm font-semibold text-primary dark:text-white">{label}</span>
          <p className="text-xs text-gray-500 dark:text-white/60 mt-0.5">{description}</p>
        </div>
      </label>
    </motion.div>
  );
}
