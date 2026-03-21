'use client';

import { motion } from 'framer-motion';
import type { CalendarListItem } from '../../types/user-context.types';
import { useTranslation } from 'react-i18next';

interface CalendarCheckboxItemProps {
  calendar: CalendarListItem;
  isSelected: boolean;
  onToggle: (id: string) => void;
  disabled?: boolean;
}

export function CalendarCheckboxItem({ calendar, isSelected, onToggle, disabled }: CalendarCheckboxItemProps) {
  const { t } = useTranslation('common');

  return (
    <motion.label
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors
        ${isSelected
          ? 'bg-accent/10 dark:bg-accent/20 border border-accent/30'
          : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-gray-800'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(calendar.id)}
        disabled={disabled}
        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-accent focus:ring-accent/50"
      />

      {/* Color indicator */}
      {calendar.color && (
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: calendar.color }}
        />
      )}

      <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">
        {calendar.name}
      </span>

      {calendar.isPrimary && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent font-medium flex-shrink-0">
          {t('studyPlanner.calendarSelection.primary')}
        </span>
      )}
    </motion.label>
  );
}
