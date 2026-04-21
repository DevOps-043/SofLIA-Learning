import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PlanEditorSectionProps {
  id: string;
  title: string;
  icon: ReactNode;
  isExpanded: boolean;
  onToggle: (section: string) => void;
  children: ReactNode;
}

export function PlanEditorSection({
  id,
  title,
  icon,
  isExpanded,
  onToggle,
  children,
}: PlanEditorSectionProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => onToggle(id)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium text-gray-900 dark:text-white">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp size={20} className="text-gray-500" />
        ) : (
          <ChevronDown size={20} className="text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="p-4 bg-white dark:bg-gray-800"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}
