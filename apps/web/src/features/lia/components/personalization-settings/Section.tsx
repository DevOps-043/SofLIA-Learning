import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type React from 'react';

interface SectionProps {
  children: React.ReactNode;
  description: string;
  icon: React.ElementType;
  isExpanded: boolean;
  onToggle: () => void;
  title: string;
}

export function Section({
  children,
  description,
  icon: Icon,
  isExpanded,
  onToggle,
  title,
}: SectionProps) {
  return (
    <div className="border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-[#0A2540] dark:text-[#00D4B3]" />
          <div className="text-left">
            <h3 className="font-semibold text-[#0A2540] dark:text-white">{title}</h3>
            <p className="text-xs text-[#6C757D] dark:text-gray-400">{description}</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-[#6C757D] dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#6C757D] dark:text-gray-400" />
        )}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
