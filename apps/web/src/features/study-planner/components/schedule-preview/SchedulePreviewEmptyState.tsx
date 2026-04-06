'use client';

import { CalendarDays } from 'lucide-react';

export function SchedulePreviewEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      <CalendarDays size={32} className="text-gray-300 dark:text-gray-600" />
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No hay sesiones programadas en esta semana.
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Navega entre semanas para ver el plan completo.
      </p>
    </div>
  );
}
