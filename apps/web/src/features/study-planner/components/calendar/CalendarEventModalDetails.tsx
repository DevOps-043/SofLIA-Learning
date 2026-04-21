import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import type { TFunction } from 'i18next';
import {
  formatCalendarLabel,
  formatCalendarTime,
  isSameCalendarDay,
} from '../hooks/study-planner-calendar.date';
import type { CalendarEventModalProps } from './types';

export function CalendarEventModalDetails({
  selectedEvent,
  t,
}: {
  selectedEvent: CalendarEventModalProps['selectedEvent'];
  t: TFunction<'common'>;
}) {
  return (
    <>
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-5 h-5 rounded-lg flex-shrink-0 mt-0.5 shadow-sm"
          style={{ backgroundColor: selectedEvent?.color || getFallbackEventColor(selectedEvent) }}
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#0A2540] dark:text-white mb-1">{selectedEvent?.title}</h3>
          {selectedEvent?.source === 'study_session' && (
            <span className="inline-block px-2 py-0.5 text-xs font-medium text-[#0A2540] dark:text-[#00D4B3] bg-[#0A2540]/10 dark:bg-[#0A2540]/20 rounded-md">
              {t('studyPlanner.calendar.studySession')}
            </span>
          )}
        </div>
      </div>

      {selectedEvent && (
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-[#6C757D] dark:text-gray-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            {selectedEvent.isAllDay ? (
              <div className="text-sm text-[#0A2540] dark:text-white">
                <div className="font-semibold mb-1">{t('studyPlanner.calendar.allDay')}</div>
                <div className="text-[#6C757D] dark:text-gray-400">{formatCalendarLabel(selectedEvent.start, "EEEE, d 'de' MMMM 'de' yyyy")}</div>
              </div>
            ) : (
              <div className="text-sm text-[#0A2540] dark:text-white">
                <div className="font-semibold mb-1">{formatCalendarLabel(selectedEvent.start, "EEEE, d 'de' MMMM 'de' yyyy")}</div>
                <div className="text-[#6C757D] dark:text-gray-400">{formatCalendarTime(selectedEvent.start)} - {formatCalendarTime(selectedEvent.end)}</div>
                {!isSameCalendarDay(selectedEvent.start, selectedEvent.end) && (
                  <div className="text-[#6C757D] dark:text-gray-400 text-xs mt-1">{t('studyPlanner.calendar.until')} {formatCalendarLabel(selectedEvent.end, "EEEE, d 'de' MMMM 'de' yyyy")}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedEvent?.location && (
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-[#6C757D] dark:text-gray-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium text-[#0A2540] dark:text-white">{selectedEvent.location}</div>
        </div>
      )}

      {selectedEvent?.description && (
        <div className="flex items-start gap-3">
          <CalendarIcon className="w-5 h-5 text-[#6C757D] dark:text-gray-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#0A2540] dark:text-white whitespace-pre-wrap leading-relaxed">{selectedEvent.description}</div>
        </div>
      )}

      {selectedEvent && (
        <div className="pt-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
          <div className="text-xs font-medium text-[#6C757D] dark:text-gray-400">
            {selectedEvent.provider === 'google' && t('studyPlanner.calendar.syncedFromGoogle')}
            {selectedEvent.provider === 'microsoft' && t('studyPlanner.calendar.syncedFromMicrosoft')}
            {selectedEvent.provider === 'study' && t('studyPlanner.calendar.plannedStudySession')}
            {selectedEvent.provider === 'local' && t('studyPlanner.calendar.customEvent')}
          </div>
        </div>
      )}
    </>
  );
}

function getFallbackEventColor(selectedEvent: CalendarEventModalProps['selectedEvent']) {
  if (selectedEvent?.source === 'study_session') return '#0A2540';
  if (selectedEvent?.provider === 'google') return '#0066CC';
  if (selectedEvent?.provider === 'microsoft') return '#0078D4';
  return '#0A2540';
}
