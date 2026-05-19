import {
  formatCalendarLabel,
  formatCalendarTime,
  isSameCalendarDay,
} from '../hooks/study-planner-calendar.date'
import type { CalendarWeekViewProps } from './types'

function getEventColor(event: { color?: string; source?: string; provider?: string }): string {
  return event.color || (event.source === 'study_session' ? 'var(--color-legacy-8e24aa)' : event.provider === 'google' ? 'var(--color-legacy-0066cc)' : event.provider === 'microsoft' ? 'var(--color-legacy-0078d4)' : 'var(--color-legacy-0066cc)')
}

export function CalendarWeekView({
  weekDays,
  today,
  hours,
  getEventLayoutsForDay,
  setSelectedEvent,
  setIsEventModalOpen,
}: CalendarWeekViewProps) {
  return (
    <div className="flex-1 flex flex-col border border-gray-200 dark:border-gray-500/30 rounded-lg overflow-hidden bg-white dark:bg-carbon-800 w-full max-w-full">
      <div className="flex-1 flex flex-col overflow-x-auto touch-pan-x w-full">
        <div className="flex-1 flex flex-col min-w-[800px]">
          <div className="flex border-b border-gray-200 dark:border-gray-500/30">
            <div className="w-16 border-r border-gray-200 dark:border-gray-500/30 flex-shrink-0"></div>
            <div className="flex flex-1">
              {weekDays.map((dayDate, index) => {
                const isToday = isSameCalendarDay(dayDate, today)
                return (
                  <div key={index} className="flex-1 px-3 py-3 border-r border-gray-200 dark:border-gray-500/30 last:border-r-0">
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        {formatCalendarLabel(dayDate, 'EEE')}
                      </div>
                      <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium ${isToday ? 'bg-primary text-white' : 'text-primary dark:text-white'}`}>
                        {formatCalendarLabel(dayDate, 'd')}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="flex">
              <div className="w-16 border-r border-gray-200 dark:border-gray-500/30 flex-shrink-0">
                {hours.map((hour) => (
                  <div key={hour} className="h-16 border-b border-gray-200 dark:border-gray-500/30 px-1.5 flex items-start justify-end pt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {hour.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-1 relative">
                {weekDays.map((dayDate, dayIndex) => {
                  const isToday = isSameCalendarDay(dayDate, today)
                  const dayLayouts = getEventLayoutsForDay(dayDate)

                  return (
                    <div
                      key={dayIndex}
                      className={`flex-1 border-r border-gray-200 dark:border-gray-500/30 last:border-r-0 relative ${isToday ? 'bg-primary/10 dark:bg-primary/20' : ''}`}
                    >
                      {hours.map((hour) => (
                        <div key={hour} className="h-16 border-b border-gray-200 dark:border-gray-500/30 relative hover:bg-gray-200/30 dark:hover:bg-primary/10 transition-colors" />
                      ))}

                      {dayLayouts.map((layout) => {
                        const { position } = layout
                        const eventColor = getEventColor(layout)

                        if (position.isAllDay) {
                          return (
                            <div
                              key={layout.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedEvent(layout); setIsEventModalOpen(true) }}
                              className="absolute top-0 left-0 right-0 px-2.5 py-1 text-xs font-medium rounded-md border-l-[3px] cursor-pointer transition-all duration-200 z-10 mx-1 mb-1 hover:opacity-90 hover:shadow-md text-white"
                              style={{ backgroundColor: eventColor, borderColor: eventColor }}
                              title={layout.title}
                            >
                              {layout.title}
                            </div>
                          )
                        }

                        return (
                          <div
                            key={layout.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(layout); setIsEventModalOpen(true) }}
                            style={{ 
                              top: `${position.top}px`, 
                              height: `${position.height}px`, 
                              left: `${position.left}%`,
                              width: `${position.width}%`,
                              backgroundColor: eventColor, 
                              zIndex: position.zIndex || 10,
                            }}
                            className="absolute px-1 py-1 text-xs font-medium rounded-md border border-black/20 border-l-[3px] border-l-white/40 cursor-pointer transition-all duration-200 overflow-hidden hover:opacity-90 hover:shadow-md min-h-[24px] text-white shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                            title={`${layout.title} - ${formatCalendarTime(layout.start)} - ${formatCalendarTime(layout.end)}`}
                          >
                            <div className="font-semibold truncate leading-tight px-1.5 pt-0.5">{layout.title}</div>
                            {position.height > 35 && (
                              <div className="text-[10px] opacity-90 truncate mt-0.5 leading-tight px-1">
                                {formatCalendarTime(layout.start)} - {formatCalendarTime(layout.end)}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
