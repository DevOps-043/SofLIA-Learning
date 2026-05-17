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
    <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} className="group relative p-4 bg-gradient-to-br from-[#E9ECEF]/50 to-[#E9ECEF]/30 dark:from-[#0A0D12] dark:to-[#0A0D12]/50 rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3]/30 dark:hover:border-[#00D4B3]/30 transition-all duration-300 cursor-pointer overflow-hidden">
      <motion.div className="absolute inset-0 bg-gradient-to-r from-[#00D4B3]/0 to-[#00D4B3]/0 group-hover:from-[#00D4B3]/5 group-hover:to-[#00D4B3]/0" transition={{ duration: 0.3 }} />
      <label className="relative flex items-center gap-3 cursor-pointer">
        <div className="relative">
          <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
          <motion.div animate={{ backgroundColor: checked ? '#00D4B3' : '#E9ECEF', borderColor: checked ? '#00D4B3' : '#E9ECEF', scale: checked ? 1 : 0.95 }} className="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 shadow-sm">
            {checked && (
              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                <CheckCircleIcon className="h-4 w-4 text-white" />
              </motion.div>
            )}
          </motion.div>
        </div>
        <div>
          <span className="text-sm font-semibold text-[#0A2540] dark:text-white">{label}</span>
          <p className="text-xs text-[#6C757D] dark:text-white/60 mt-0.5">{description}</p>
        </div>
      </label>
    </motion.div>
  );
}
