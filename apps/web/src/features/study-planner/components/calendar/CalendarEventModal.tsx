import { X, Edit2, Trash2, Clock, MapPin, Calendar as CalendarIcon, Save, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  fromDateOnlyEndValue,
  fromDateOnlyStartValue,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
  toDateValue,
} from '../hooks/study-planner-calendar.date'
import type { CalendarEventModalProps } from './types'
import { CalendarEventModalDetails } from './CalendarEventModalDetails'

const EMPTY_FORM = {
  title: '',
  description: '',
  start: '',
  end: '',
  location: '',
  isAllDay: false,
  color: 'var(--color-primary)',
}

export function CalendarEventModal({
  isEventModalOpen,
  selectedEvent,
  isCreatingEvent,
  isEditMode,
  setIsEditMode,
  setIsCreatingEvent,
  isDeletingEvent,
  isSaving,
  eventForm,
  setEventForm,
  eventColors,
  handleEditEvent,
  handleDeleteEvent,
  handleSaveEvent,
  setSelectedEvent,
  setIsEventModalOpen,
}: CalendarEventModalProps) {
  const { t } = useTranslation('common')

  function closeModal() {
    setIsEventModalOpen(false)
    setSelectedEvent(null)
    setIsEditMode(false)
    setIsCreatingEvent(false)
    setEventForm(EMPTY_FORM)
  }

  return (
    <AnimatePresence>
      {isEventModalOpen && (selectedEvent || isCreatingEvent) && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!isEditMode && !isCreatingEvent) closeModal() }}
            className="fixed inset-0 bg-carbon-900/80 backdrop-blur-sm z-50 transition-opacity"
          />

          <div className="pointer-events-none fixed inset-0 z-50 flex h-app-dynamic items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              initial={{ y: '100%', opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: '100%', opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto bg-white dark:bg-carbon-800 w-full sm:max-w-xl rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden border-t sm:border border-gray-200 dark:border-gray-500/30 max-h-[90vh] sm:max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-500/30">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {!isEditMode && !isCreatingEvent && selectedEvent && (
                    <>
                      <button onClick={handleEditEvent} className="p-2 hover:bg-gray-200 dark:hover:bg-primary/20 rounded-lg transition-colors" aria-label={t('studyPlanner.calendar.edit')}>
                        <Edit2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </button>
                      <button onClick={handleDeleteEvent} disabled={isDeletingEvent} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50" aria-label={t('studyPlanner.calendar.delete')}>
                        <Trash2 className="w-5 h-5 text-red-500 dark:text-red-400" />
                      </button>
                    </>
                  )}
                  <h2 className="text-lg font-semibold text-primary dark:text-white flex-1 truncate">
                    {isCreatingEvent ? t('studyPlanner.calendar.newEvent') : selectedEvent?.title || ''}
                  </h2>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-gray-200 dark:hover:bg-primary/20 rounded-lg transition-colors" aria-label={t('studyPlanner.calendar.close')}>
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 overscroll-contain">
                {isEditMode || isCreatingEvent ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveEvent() }} className="space-y-5">
                    <div>
                      <input
                        type="text"
                        value={eventForm.title}
                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                        placeholder={t('studyPlanner.calendar.addTitle')}
                        className="w-full px-4 py-2.5 text-base font-medium bg-white dark:bg-carbon-800 border border-gray-200 dark:border-gray-500/30 rounded-lg text-primary dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                        required
                        autoFocus
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-500 dark:text-gray-500 flex-shrink-0" />
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          {!eventForm.isAllDay ? (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('studyPlanner.calendar.start')}</label>
                                <input type="datetime-local" value={toDateTimeLocalValue(eventForm.start)} onChange={(e) => setEventForm({ ...eventForm, start: fromDateTimeLocalValue(e.target.value) })} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-500/30 rounded-lg bg-white dark:bg-carbon-800 text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all" required />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('studyPlanner.calendar.end')}</label>
                                <input type="datetime-local" value={toDateTimeLocalValue(eventForm.end)} onChange={(e) => setEventForm({ ...eventForm, end: fromDateTimeLocalValue(e.target.value) })} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-500/30 rounded-lg bg-white dark:bg-carbon-800 text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all" required />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('studyPlanner.calendar.startDate')}</label>
                                <input type="date" value={toDateValue(eventForm.start)} onChange={(e) => setEventForm({ ...eventForm, start: fromDateOnlyStartValue(e.target.value) })} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-500/30 rounded-lg bg-white dark:bg-carbon-800 text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all" required />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('studyPlanner.calendar.endDate')}</label>
                                <input type="date" value={toDateValue(eventForm.end)} onChange={(e) => setEventForm({ ...eventForm, end: fromDateOnlyEndValue(e.target.value) })} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-500/30 rounded-lg bg-white dark:bg-carbon-800 text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all" required />
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pl-8">
                        <input type="checkbox" id="isAllDay" checked={eventForm.isAllDay} onChange={(e) => setEventForm({ ...eventForm, isAllDay: e.target.checked })} className="w-5 h-5 text-primary border-gray-200 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-accent bg-white dark:bg-carbon-800" />
                        <label htmlFor="isAllDay" className="text-sm font-medium text-primary dark:text-white cursor-pointer">{t('studyPlanner.calendar.allDay')}</label>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-500 flex-shrink-0 mt-2.5" />
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('studyPlanner.calendar.location')}</label>
                        <input type="text" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder={t('studyPlanner.calendar.addLocation')} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-500/30 rounded-lg bg-white dark:bg-carbon-800 text-primary dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all" />
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-500 flex-shrink-0 mt-2.5" />
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('studyPlanner.calendar.description')}</label>
                        <textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} placeholder={t('studyPlanner.calendar.addDescription')} rows={4} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-500/30 rounded-lg bg-white dark:bg-carbon-800 text-primary dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none" />
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 flex-shrink-0 mt-2.5 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: eventForm.color }} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('studyPlanner.calendar.color')}</label>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {eventColors.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => setEventForm({ ...eventForm, color: color.value })}
                              className={`w-9 h-9 rounded-lg transition-all shadow-sm ${eventForm.color === color.value ? 'ring-2 ring-offset-2 ring-primary dark:ring-accent scale-110 shadow-md' : 'hover:scale-105 hover:shadow-md'}`}
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                              aria-label={color.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-500/30">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditMode(false)
                          setIsCreatingEvent(false)
                          setEventForm(EMPTY_FORM)
                          if (!selectedEvent) setIsEventModalOpen(false)
                        }}
                        className="px-5 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-primary/20 rounded-md transition-colors"
                      >
                        {t('studyPlanner.calendar.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        style={{ backgroundColor: eventForm.color }}
                      >
                        {isSaving ? (
                          <><RefreshCw className="w-4 h-4 animate-spin" />{t('studyPlanner.calendar.saving')}</>
                        ) : (
                          <><Save className="w-4 h-4" />{isCreatingEvent ? t('studyPlanner.calendar.createEvent') : t('studyPlanner.calendar.saveChanges')}</>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <CalendarEventModalDetails selectedEvent={selectedEvent} t={t} />
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
