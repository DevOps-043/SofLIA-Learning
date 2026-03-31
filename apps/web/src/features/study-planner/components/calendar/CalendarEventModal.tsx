import { X, Edit2, Trash2, Clock, MapPin, Calendar as CalendarIcon, Save, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import moment from 'moment'
import type { CalendarEventModalProps } from './types'

const EMPTY_FORM = {
  title: '',
  description: '',
  start: '',
  end: '',
  location: '',
  isAllDay: false,
  color: '#0A2540',
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
            className="fixed inset-0 bg-[#0F1419]/80 backdrop-blur-sm z-50 transition-opacity"
          />

          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
            <motion.div
              initial={{ y: '100%', opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: '100%', opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto bg-white dark:bg-[#1E2329] w-full sm:max-w-xl rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden border-t sm:border border-[#E9ECEF] dark:border-[#6C757D]/30 max-h-[90vh] sm:max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {!isEditMode && !isCreatingEvent && selectedEvent && (
                    <>
                      <button onClick={handleEditEvent} className="p-2 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-lg transition-colors" aria-label="Editar">
                        <Edit2 className="w-5 h-5 text-[#6C757D] dark:text-gray-400" />
                      </button>
                      <button onClick={handleDeleteEvent} disabled={isDeletingEvent} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50" aria-label="Eliminar">
                        <Trash2 className="w-5 h-5 text-red-500 dark:text-red-400" />
                      </button>
                    </>
                  )}
                  <h2 className="text-lg font-semibold text-[#0A2540] dark:text-white flex-1 truncate">
                    {isCreatingEvent ? 'Nuevo evento' : selectedEvent?.title || ''}
                  </h2>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-lg transition-colors" aria-label="Cerrar">
                  <X className="w-5 h-5 text-[#6C757D] dark:text-gray-400" />
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
                        placeholder="Añadir título"
                        className="w-full px-4 py-2.5 text-base font-medium bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-transparent transition-all"
                        required
                        autoFocus
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-[#6C757D] dark:text-gray-500 flex-shrink-0" />
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          {!eventForm.isAllDay ? (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-[#6C757D] dark:text-gray-400 mb-1.5">Inicio</label>
                                <input type="datetime-local" value={moment(eventForm.start).format('YYYY-MM-DDTHH:mm')} onChange={(e) => setEventForm({ ...eventForm, start: moment(e.target.value).toISOString() })} className="w-full px-3 py-2 text-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-transparent transition-all" required />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-[#6C757D] dark:text-gray-400 mb-1.5">Fin</label>
                                <input type="datetime-local" value={moment(eventForm.end).format('YYYY-MM-DDTHH:mm')} onChange={(e) => setEventForm({ ...eventForm, end: moment(e.target.value).toISOString() })} className="w-full px-3 py-2 text-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-transparent transition-all" required />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-[#6C757D] dark:text-gray-400 mb-1.5">Fecha inicio</label>
                                <input type="date" value={moment(eventForm.start).format('YYYY-MM-DD')} onChange={(e) => setEventForm({ ...eventForm, start: moment(e.target.value).startOf('day').toISOString() })} className="w-full px-3 py-2 text-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-transparent transition-all" required />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-[#6C757D] dark:text-gray-400 mb-1.5">Fecha fin</label>
                                <input type="date" value={moment(eventForm.end).format('YYYY-MM-DD')} onChange={(e) => setEventForm({ ...eventForm, end: moment(e.target.value).endOf('day').toISOString() })} className="w-full px-3 py-2 text-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-transparent transition-all" required />
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pl-8">
                        <input type="checkbox" id="isAllDay" checked={eventForm.isAllDay} onChange={(e) => setEventForm({ ...eventForm, isAllDay: e.target.checked })} className="w-5 h-5 text-[#0A2540] border-[#E9ECEF] dark:border-[#6C757D] rounded-lg focus:ring-2 focus:ring-[#00D4B3] bg-white dark:bg-[#1E2329]" />
                        <label htmlFor="isAllDay" className="text-sm font-medium text-[#0A2540] dark:text-white cursor-pointer">Todo el día</label>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#6C757D] dark:text-gray-500 flex-shrink-0 mt-2.5" />
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-[#6C757D] dark:text-gray-400 mb-1.5">Ubicación</label>
                        <input type="text" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="Añadir ubicación" className="w-full px-3 py-2 text-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-transparent transition-all" />
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CalendarIcon className="w-5 h-5 text-[#6C757D] dark:text-gray-500 flex-shrink-0 mt-2.5" />
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-[#6C757D] dark:text-gray-400 mb-1.5">Descripción</label>
                        <textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Añadir descripción" rows={4} className="w-full px-3 py-2 text-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-transparent transition-all resize-none" />
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 flex-shrink-0 mt-2.5 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: eventForm.color }} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-[#6C757D] dark:text-gray-400 mb-2">Color</label>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {eventColors.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => setEventForm({ ...eventForm, color: color.value })}
                              className={`w-9 h-9 rounded-lg transition-all shadow-sm ${eventForm.color === color.value ? 'ring-2 ring-offset-2 ring-[#0A2540] dark:ring-[#00D4B3] scale-110 shadow-md' : 'hover:scale-105 hover:shadow-md'}`}
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                              aria-label={color.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditMode(false)
                          setIsCreatingEvent(false)
                          setEventForm(EMPTY_FORM)
                          if (!selectedEvent) setIsEventModalOpen(false)
                        }}
                        className="px-5 py-2 text-xs font-medium text-[#6C757D] dark:text-gray-400 hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 rounded-md transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        style={{ backgroundColor: eventForm.color }}
                      >
                        {isSaving ? (
                          <><RefreshCw className="w-4 h-4 animate-spin" />Guardando...</>
                        ) : (
                          <><Save className="w-4 h-4" />{isCreatingEvent ? 'Crear evento' : 'Guardar cambios'}</>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className="w-5 h-5 rounded-lg flex-shrink-0 mt-0.5 shadow-sm"
                        style={{ backgroundColor: selectedEvent?.color || (selectedEvent?.source === 'study_session' ? '#0A2540' : selectedEvent?.provider === 'google' ? '#0066CC' : selectedEvent?.provider === 'microsoft' ? '#0078D4' : '#0A2540') }}
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#0A2540] dark:text-white mb-1">{selectedEvent?.title}</h3>
                        {selectedEvent?.source === 'study_session' && (
                          <span className="inline-block px-2 py-0.5 text-xs font-medium text-[#0A2540] dark:text-[#00D4B3] bg-[#0A2540]/10 dark:bg-[#0A2540]/20 rounded-md">
                            Sesión de estudio
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
                              <div className="font-semibold mb-1">Todo el día</div>
                              <div className="text-[#6C757D] dark:text-gray-400">{moment(selectedEvent.start).format('dddd, D [de] MMMM [de] YYYY')}</div>
                            </div>
                          ) : (
                            <div className="text-sm text-[#0A2540] dark:text-white">
                              <div className="font-semibold mb-1">{moment(selectedEvent.start).format('dddd, D [de] MMMM [de] YYYY')}</div>
                              <div className="text-[#6C757D] dark:text-gray-400">{moment(selectedEvent.start).format('h:mm A')} - {moment(selectedEvent.end).format('h:mm A')}</div>
                              {moment(selectedEvent.start).format('YYYY-MM-DD') !== moment(selectedEvent.end).format('YYYY-MM-DD') && (
                                <div className="text-[#6C757D] dark:text-gray-400 text-xs mt-1">Hasta {moment(selectedEvent.end).format('dddd, D [de] MMMM [de] YYYY')}</div>
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
                          {selectedEvent.provider === 'google' && 'Sincronizado desde Google Calendar'}
                          {selectedEvent.provider === 'microsoft' && 'Sincronizado desde Microsoft Calendar'}
                          {selectedEvent.provider === 'study' && 'Sesión de estudio planificada'}
                          {selectedEvent.provider === 'local' && 'Evento personalizado'}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
