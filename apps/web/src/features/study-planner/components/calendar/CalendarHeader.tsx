import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
      ? currentDate.format('MMMM YYYY')
      : view === 'week'
      ? weekRange
        ? `${weekRange.start.format('D MMM')} - ${weekRange.end.format('D MMM YYYY')}`
        : ''
      : currentDate.format('dddd, D [de] MMMM [de] YYYY')

  const goPrevious = view === 'month' ? goToPreviousMonth : view === 'week' ? goToPreviousWeek : goToPreviousDay
  const goNext = view === 'month' ? goToNextMonth : view === 'week' ? goToNextWeek : goToNextDay
  const prevLabel = view === 'month' ? 'Mes anterior' : view === 'week' ? 'Semana anterior' : 'Día anterior'
  const nextLabel = view === 'month' ? 'Mes siguiente' : view === 'week' ? 'Semana siguiente' : 'Día siguiente'

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 pb-3 border-b border-[#E9ECEF] dark:border-[#6C757D]/30 gap-4 sm:gap-0">
      <h2 className="text-xl font-semibold text-[#0A2540] dark:text-white truncate max-w-full">{title}</h2>

      <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto no-scrollbar">
        <button
          onClick={handleCreateEvent}
          className="px-3 sm:px-4 py-2 text-sm font-medium text-white bg-[#0A2540] hover:bg-[#0d2f4d] rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
          title="Crear evento"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Crear evento</span>
        </button>

        <div className="flex items-center gap-1 bg-[#E9ECEF]/50 dark:bg-[#0A2540]/5 rounded-lg p-1">
          {(['month', 'week', 'day'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === v
                  ? 'bg-[#0A2540] dark:bg-[#0A2540] text-white shadow-sm'
                  : 'text-[#0A2540] dark:text-[#00D4B3] hover:text-white hover:bg-[#0A2540]/80 dark:hover:bg-[#00D4B3]/80'
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
            className="rounded-lg bg-white dark:bg-[#1E2329] text-[#6C757D] dark:text-gray-400 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 border border-[#E9ECEF] dark:border-[#6C757D]/30 transition-colors flex items-center overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="px-3 py-1.5 text-xs font-medium text-[#0A2540] dark:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-md transition-colors"
          >
            Hoy
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={goPrevious}
              className="p-2 text-[#6C757D] dark:text-gray-400 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-md transition-colors"
              aria-label={prevLabel}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goNext}
              className="p-2 text-[#6C757D] dark:text-gray-400 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-md transition-colors"
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
