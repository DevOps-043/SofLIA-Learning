import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCalendarLabel } from '../hooks/study-planner-calendar.date'
import type { CalendarHeaderProps } from './types'

export function CalendarHeader({
  currentDate,
  view,
  setView,
  weekRange,
  isRefreshing,
  isLoadingEvents,
  hoveredRefreshButton,
  setHoveredRefreshButton,
  goToPreviousMonth,
  goToNextMonth,
  goToPreviousWeek,
  goToNextWeek,
  goToPreviousDay,
  goToNextDay,
  goToToday,
  handleManualRefresh,
  handleCreateEvent,
}: CalendarHeaderProps) {
  const title =
    view === 'month'
      ? formatCalendarLabel(currentDate, 'MMMM yyyy')
      : view === 'week'
      ? weekRange
        ? `${formatCalendarLabel(weekRange.start, 'd MMM')} - ${formatCalendarLabel(weekRange.end, 'd MMM yyyy')}`
        : ''
      : formatCalendarLabel(currentDate, "EEEE, d 'de' MMMM 'de' yyyy")

  const goPrevious = view === 'month' ? goToPreviousMonth : view === 'week' ? goToPreviousWeek : goToPreviousDay
  const goNext = view === 'month' ? goToNextMonth : view === 'week' ? goToNextWeek : goToNextDay
  const prevLabel = view === 'month' ? 'Mes anterior' : view === 'week' ? 'Semana anterior' : 'Día anterior'
  const nextLabel = view === 'month' ? 'Mes siguiente' : view === 'week' ? 'Semana siguiente' : 'Día siguiente'

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 pb-3 border-b border-gray-200 dark:border-gray-500/30 gap-4 sm:gap-0">
      <h2 className="text-xl font-semibold text-primary dark:text-white truncate max-w-full">{title}</h2>

      <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto no-scrollbar">
        <button
          onClick={handleCreateEvent}
          className="px-3 sm:px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
          title="Crear evento"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Crear evento</span>
        </button>

        <div className="flex items-center gap-1 bg-gray-200/50 dark:bg-primary/5 rounded-lg p-1">
          {(['month', 'week', 'day'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === v
                  ? 'bg-primary dark:bg-primary text-white shadow-sm'
                  : 'text-primary dark:text-accent hover:text-white hover:bg-primary/80 dark:hover:bg-accent/80'
              }`}
            >
              {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            layout
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoadingEvents}
            onMouseEnter={() => setHoveredRefreshButton(true)}
            onMouseLeave={() => setHoveredRefreshButton(false)}
            whileTap={{ scale: 0.95 }}
            className="rounded-lg bg-white dark:bg-carbon-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-primary/20 border border-gray-200 dark:border-gray-500/30 transition-colors flex items-center overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Recargar calendario"
            title="Recargar calendario"
          >
            <motion.div
              className="p-2.5 flex-shrink-0 flex items-center justify-center"
              animate={isRefreshing || hoveredRefreshButton ? { rotate: 360 } : {}}
              transition={{
                duration: 1,
                repeat: isRefreshing || hoveredRefreshButton ? Infinity : 0,
                ease: 'linear',
              }}
            >
              <RefreshCw className="w-5 h-5" />
            </motion.div>
            <AnimatePresence>
              {hoveredRefreshButton && !isRefreshing && (
                <motion.span
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="pr-3 whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
                >
                  Recargar
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-primary dark:text-white hover:bg-gray-200 dark:hover:bg-primary/20 rounded-md transition-colors"
          >
            Hoy
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={goPrevious}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-primary/20 rounded-md transition-colors"
              aria-label={prevLabel}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goNext}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-primary/20 rounded-md transition-colors"
              aria-label={nextLabel}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
