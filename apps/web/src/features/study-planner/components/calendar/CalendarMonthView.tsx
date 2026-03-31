import type { CalendarMonthViewProps } from './types'

export function CalendarMonthView({
  monthDays,
  weekDayNames,
  getEventsForDay,
  getEventColor,
  setCurrentDate,
  handleCreateEvent,
  setSelectedEvent,
  setIsEventModalOpen,
}: CalendarMonthViewProps) {
  const MAX_EVENTS_TO_SHOW = 3

  return (
    <div className="flex-1 flex flex-col border-x-0 sm:border border-y sm:border-y border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-none sm:rounded-lg overflow-hidden bg-white dark:bg-[#1E2329] w-full max-w-full">
      <div className="flex-1 flex flex-col w-full min-w-0">
        <div className="flex-1 flex flex-col w-full min-w-0">
          <div className="grid grid-cols-7 border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
            {weekDayNames.map((day, index) => (
              <div
                key={index}
                className="py-1 text-[9px] sm:text-xs font-medium text-[#6C757D] dark:text-gray-400 uppercase tracking-wider text-center border-r border-[#E9ECEF] dark:border-[#6C757D]/30 last:border-r-0 truncate overflow-hidden"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-7 auto-rows-fr">
            {monthDays.map((dayInfo, index) => {
              const dayEvents = getEventsForDay(dayInfo.date)
              const eventsToDisplay = dayEvents.slice(0, MAX_EVENTS_TO_SHOW)
              const moreCount = dayEvents.length - MAX_EVENTS_TO_SHOW

              return (
                <div
                  key={index}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setCurrentDate(dayInfo.date)
                      handleCreateEvent()
                    }
                  }}
                  className={`
                    min-h-[60px] sm:min-h-[120px] p-0.5 sm:p-2 border-r border-b border-[#E9ECEF] dark:border-[#6C757D]/30 relative transition-colors
                    ${dayInfo.isCurrentMonth ? 'bg-white dark:bg-[#1E2329]' : 'bg-gray-50/50 dark:bg-[#1E2329]/50'}
                    ${dayInfo.isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
                    ${(index + 1) % 7 === 0 ? 'border-r-0' : ''}
                    hover:bg-gray-50 dark:hover:bg-[#2C333A] cursor-pointer flex flex-col items-center sm:items-stretch overflow-hidden min-w-0
                  `}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`
                        text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                        ${dayInfo.isToday
                          ? 'bg-[#0A2540] text-white shadow-sm'
                          : dayInfo.isCurrentMonth
                          ? 'text-[#0A2540] dark:text-gray-300'
                          : 'text-gray-400 dark:text-gray-600'
                        }
                      `}
                    >
                      {dayInfo.date.format('D')}
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5 sm:gap-1 w-full overflow-hidden">
                    {eventsToDisplay.map((event) => {
                      const eventColor = getEventColor(event)
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedEvent(event)
                            setIsEventModalOpen(true)
                          }}
                          className="px-0.5 sm:px-2 py-0 sm:py-0.5 rounded-[2px] sm:rounded text-[8px] sm:text-[10px] font-medium truncate border-l-[1px] sm:border-l-[3px] cursor-pointer transition-all duration-200 hover:opacity-80 hover:shadow-sm text-white leading-tight min-w-0"
                          style={{ backgroundColor: eventColor, borderColor: eventColor }}
                          title={`${event.title}${event.isAllDay ? ' (Todo el día)' : ''}`}
                        >
                          {event.title}
                        </div>
                      )
                    })}
                    {moreCount > 0 && (
                      <div className="text-[8px] sm:text-[10px] text-gray-500 font-medium pl-1">
                        +{moreCount} más
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
