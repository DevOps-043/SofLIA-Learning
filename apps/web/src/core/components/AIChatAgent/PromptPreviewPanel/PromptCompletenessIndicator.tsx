import { motion } from 'framer-motion';

interface PromptCompletenessIndicatorProps {
  completeness: number;
}

export function PromptCompletenessIndicator({
  completeness
}: PromptCompletenessIndicatorProps) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Completitud
        </span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">
          {completeness}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${completeness}%` }}
          className={`h-2 rounded-full transition-colors ${getCompletenessColor(completeness)}`}
        />
      </div>
      {completeness < 100 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Completa todos los campos para mejorar la calidad del prompt
        </p>
      )}
    </div>
  );
}

function getCompletenessColor(completeness: number) {
  if (completeness === 100) {
    return 'bg-green-500';
  }

  return completeness >= 70 ? 'bg-blue-500' : 'bg-yellow-500';
}
