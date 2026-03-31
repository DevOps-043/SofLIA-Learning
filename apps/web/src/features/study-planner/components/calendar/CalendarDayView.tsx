import moment from 'moment'
import type { CalendarDayViewProps } from './types'

function getEventColor(event: { color?: string; source?: string; provider?: string }): string {
  return event.color || (event.source === 'study_session' ? '#8E24AA' : event.provider === 'google' ? '#0066CC' : event.provider === 'microsoft' ? '#0078D4' : '#0066CC')
}

export function CalendarDayView({
  currentDate,
  today,
  hours,
  getEventsForDay,
  getEventPosition,
  setSelectedEvent,
  setIsEventModalOpen,
}: CalendarDayViewProps) {
  const isToday = currentDate.isSame(today, 'day')
  const dayEvents = getEventsForDay(currentDate)

  return (
    <div className="flex-1 flex flex-col border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg overflow-hidden bg-white dark:bg-[#1E2329]">
      <div className="flex border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
        <div className="w-16 border-r border-[#E9ECEF] dark:border-[#6C757D]/30 flex-shrink-0"></div>
        <div className="flex-1 px-4 py-3">
          <div>
            <div className="text-xs font-medium text-[#6C757D] dark:text-gray-400 uppercase tracking-wider mb-1">
              {currentDate.format('dddd')}
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-medium ${isToday ? 'bg-[#0A2540] text-white' : 'text-[#0A2540] dark:text-white'}`}>
                {currentDate.format('D')}
              </div>
              <span className="text-sm text-[#6C757D] dark:text-gray-400">{currentDate.format('MMMM YYYY')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex">
          <div className="w-16 border-r border-[#E9ECEF] dark:border-[#6C757D]/30 flex-shrink-0">
            {hours.map((hour) => (
              <div key={hour} className="h-16 border-b border-[#E9ECEF] dark:border-[#6C757D]/30 px-1.5 flex items-start justify-end pt-1">
                <span className="text-xs text-[#6C757D] dark:text-gray-400">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          <div className={`flex-1 relative ${isToday ? 'bg-[#0A2540]/10 dark:bg-[#0A2540]/20' : ''}`}>
            {hours.map((hour) => (
              <div key={hour} className="h-16 border-b border-[#E9ECEF] dark:border-[#6C757D]/30 relative hover:bg-[#E9ECEF]/30 dark:hover:bg-[#0A2540]/10 transition-colors" />
            ))}

            {dayEvents.map((event) => {
              const position = getEventPosition(event, currentDate)
              if (!position) return null
              const eventColor = getEventColor(event)

              if (position.isAllDay) {
                return (
                  <div
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); setIsEventModalOpen(true) }}
                    className="absolute top-0 left-0 right-0 px-2.5 py-1 text-xs font-medium rounded-md border-l-[3px] cursor-pointer transition-all duration-200 z-10 mx-1 mb-1 hover:opacity-90 hover:shadow-md text-white"
                    style={{ backgroundColor: eventColor, borderColor: eventColor }}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                )
              }

              return (
                <div
                  key={event.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); setIsEventModalOpen(true) }}
                  style={{ top: `${position.top}px`, height: `${position.height}px`, backgroundColor: eventColor, borderColor: eventColor }}
                  className="absolute left-0 right-0 px-2.5 py-1.5 text-xs font-medium rounded-md border-l-[3px] cursor-pointer transition-all duration-200 z-10 mx-1.5 overflow-hidden hover:opacity-90 hover:shadow-md min-h-[24px] text-white"
                  title={`${event.title} - ${moment(event.start).format('h:mm A')} - ${moment(event.end).format('h:mm A')}`}
                >
                  <div className="font-semibold truncate leading-tight">{event.title}</div>
                  {position.height > 35 && (
                    <div className="text-[10px] opacity-90 truncate mt-0.5 leading-tight">
                      {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
                    </div>
                  )}
                  {position.height > 50 && event.description && (
                    <div className="text-[10px] opacity-80 truncate mt-1 leading-tight line-clamp-2">
                      {event.description}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
