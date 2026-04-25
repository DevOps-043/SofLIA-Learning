'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Check, AlertCircle, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCalendarSelection } from './hooks/useCalendarSelection';
import { CalendarCheckboxItem } from './CalendarCheckboxItem';

interface CalendarSelectionPanelProps {
  provider: 'google' | 'microsoft';
  onSaveSuccess?: () => void;
}

export function CalendarSelectionPanel({ provider, onSaveSuccess }: CalendarSelectionPanelProps) {
  const { t } = useTranslation('common');
  const {
    calendars,
    selectedIds,
    isLoading,
    isSaving,
    error,
    hasChanges,
    staleWarning,
    fetchCalendars,
    toggleCalendar,
    selectAll,
    deselectAll,
    saveSelection,
  } = useCalendarSelection(provider);

  useEffect(() => {
    fetchCalendars();
  }, [fetchCalendars]);

  const handleSave = async () => {
    const success = await saveSelection();
    if (success) {
      onSaveSuccess?.();
    }
  };

  const text = {
    refreshing: t('studyPlanner.calendarSelection.refreshing', { defaultValue: 'Actualizando...' }),
    title: t('studyPlanner.calendarSelection.title', { defaultValue: 'Seleccionar calendarios' }),
    subtitle: t('studyPlanner.calendarSelection.subtitle', {
      defaultValue: 'Elige que calendarios se usaran para analizar tu disponibilidad',
    }),
    refresh: t('studyPlanner.calendarSelection.refresh', { defaultValue: 'Actualizar' }),
    staleWarning: t('studyPlanner.calendarSelection.staleWarning', {
      defaultValue: 'Algunos calendarios seleccionados ya no existen y fueron removidos',
    }),
    noCalendarsFound: t('studyPlanner.calendarSelection.noCalendarsFound', {
      defaultValue: 'No se encontraron calendarios',
    }),
    selectAll: t('studyPlanner.calendarSelection.selectAll', { defaultValue: 'Seleccionar todos' }),
    deselectAll: t('studyPlanner.calendarSelection.deselectAll', { defaultValue: 'Deseleccionar todos' }),
    saving: t('studyPlanner.calendarSelection.saving', { defaultValue: 'Guardando...' }),
    saved: t('studyPlanner.calendarSelection.saved', { defaultValue: 'Seleccion guardada' }),
    save: t('studyPlanner.calendarSelection.save', { defaultValue: 'Guardar seleccion' }),
  };

  if (isLoading && calendars.length === 0) {
    return (
      <div className="p-4 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">{text.refreshing}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            {text.title}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {text.subtitle}
          </p>
        </div>
        <button
          onClick={fetchCalendars}
          disabled={isLoading}
          className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          title={text.refresh}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stale warning */}
      <AnimatePresence>
        {staleWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs"
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{text.staleWarning}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs"
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {calendars.length === 0 && !isLoading && (
        <div className="py-6 text-center text-gray-500 dark:text-gray-400">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{text.noCalendarsFound}</p>
        </div>
      )}

      {/* Calendar list */}
      {calendars.length > 0 && (
        <>
          {/* Select/Deselect all */}
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={selectAll}
              className="text-accent hover:underline"
            >
              {text.selectAll}
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button
              onClick={deselectAll}
              className="text-gray-500 dark:text-gray-400 hover:underline"
            >
              {text.deselectAll}
            </button>
          </div>

          {/* Checkbox list */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {calendars.map(calendar => (
              <CalendarCheckboxItem
                key={calendar.id}
                calendar={calendar}
                isSelected={selectedIds.has(calendar.id)}
                onToggle={toggleCalendar}
                disabled={isSaving}
              />
            ))}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving || selectedIds.size === 0}
            className={`
              w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all
              ${hasChanges && selectedIds.size > 0
                ? 'bg-accent text-white hover:bg-accent/90'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'}
            `}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {text.saving}
              </>
            ) : !hasChanges ? (
              <>
                <Check className="w-4 h-4" />
                {text.saved}
              </>
            ) : (
              text.save
            )}
          </button>
        </>
      )}
    </div>
  );
}
