import { Plus, ChevronDown, ChevronRight, Clock, FileText, ClipboardList, Edit3, Trash2 } from 'lucide-react'
import type { AdminModule } from '../../../admin/services/adminModules.service'
import type { AdminLesson } from '../../../admin/services/adminLessons.service'
import type { InstructorModulesTabProps } from './types'

export function InstructorModulesTab({
  modules,
  modulesLoading,
  expandedModules,
  expandedLessons,
  toggleModule,
  toggleLesson,
  lessons,
  materials,
  activities,
  setSelectedModule,
  setShowModuleModal,
  setDeletingModule,
  setShowDeleteModuleModal,
  setSelectedLesson,
  setShowLessonModal,
  setEditingModuleId,
  setEditingLessonId,
  setEditingActivityId,
  setDeletingLesson,
  setShowDeleteLessonModal,
  setShowMaterialModal,
  setShowActivityModal,
}: InstructorModulesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => {
            setSelectedModule(null)
            setShowModuleModal(true)
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-white shadow-lg transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">Agregar Módulo</span>
        </button>
      </div>

      {modulesLoading ? (
        <div className="text-center py-20 text-purple-200">Cargando módulos...</div>
      ) : modules.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-purple-800/40 rounded-xl text-purple-200">
          No hay módulos aún
        </div>
      ) : (
        [...modules]
          .sort((a, b) => {
            const extractModuleNumber = (title: string): number => {
              const match = title.match(/Módulo\s*(\d+)/i)
              return match ? parseInt(match[1], 10) : 999
            }
            const aNumber = extractModuleNumber(a.module_title)
            const bNumber = extractModuleNumber(b.module_title)
            if (aNumber !== 999 && bNumber !== 999) return aNumber - bNumber
            if (aNumber !== 999 && bNumber === 999) return -1
            if (aNumber === 999 && bNumber !== 999) return 1
            const orderDiff = (a.module_order_index || 0) - (b.module_order_index || 0)
            if (orderDiff !== 0) return orderDiff
            return a.module_title.localeCompare(b.module_title)
          })
          .map((module: AdminModule) => (
            <div key={module.module_id} className="overflow-hidden rounded-xl border border-purple-800/30 bg-gray-900/60">
              <div className="flex flex-col gap-4 border-b border-purple-800/30 p-4 sm:p-6">
                <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                  <button onClick={() => toggleModule(module.module_id)} className="text-purple-300 hover:text-white">
                    {expandedModules.has(module.module_id) ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-white text-xl">{module.module_title}</span>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-purple-200">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-900/30 text-green-300 border border-green-700/40">
                        {module.is_published ? '✓ Publicado' : '● Borrador'}
                      </span>
                      <span className="text-sm flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {module.module_duration_minutes} min
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedModule(module)
                      setShowModuleModal(true)
                    }}
                    className="rounded-lg bg-purple-900/30 px-4 py-2 text-sm text-purple-200 hover:bg-purple-800/40"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      setDeletingModule(module)
                      setShowDeleteModuleModal(true)
                    }}
                    className="rounded-lg bg-red-900/30 px-4 py-2 text-sm text-red-200 hover:bg-red-800/40"
                    title="Eliminar módulo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingModuleId(module.module_id)
                      setSelectedLesson(null)
                      setShowLessonModal(true)
                    }}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-900/30 p-3 hover:bg-indigo-800/40 sm:w-auto"
                    title="Agregar lección"
                  >
                    <Plus className="w-5 h-5 text-indigo-300" />
                  </button>
                </div>
              </div>

              {expandedModules.has(module.module_id) && (
                <div className="p-6">
                  {lessons.filter((l: AdminLesson) => l.module_id === module.module_id).length === 0 ? (
                    <div className="text-center py-10 text-purple-200/80 border border-dashed border-purple-800/30 rounded-xl">
                      No hay lecciones aún
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lessons.filter((l: AdminLesson) => l.module_id === module.module_id).map((lesson: AdminLesson) => (
                        <div key={lesson.lesson_id} className="rounded-xl border border-purple-800/30 bg-gray-900/40">
                          <div className="flex flex-col gap-3 p-4">
                            <div className="flex min-w-0 items-start gap-3">
                              <button onClick={() => toggleLesson(lesson.lesson_id)} className="text-purple-300 hover:text-white">
                                {expandedLessons.has(lesson.lesson_id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                              </button>
                              <div className="min-w-0 flex-1">
                                <div className="text-white font-semibold">{lesson.lesson_title}</div>
                                <div className="text-xs text-purple-200 mt-1 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />{Math.floor(lesson.duration_seconds / 60)} min
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedLesson(lesson)
                                  setEditingModuleId(lesson.module_id)
                                  setShowLessonModal(true)
                                }}
                                className="rounded-lg bg-blue-900/30 px-3 py-2 text-sm text-blue-200 hover:bg-blue-800/40"
                                title="Editar lección"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingLesson(lesson)
                                  setShowDeleteLessonModal(true)
                                }}
                                className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-200 hover:bg-red-800/40"
                                title="Eliminar lección"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingLessonId(lesson.lesson_id)
                                  setShowMaterialModal(true)
                                }}
                                className="rounded-lg bg-indigo-900/30 p-2.5 hover:bg-indigo-800/40"
                                title="Agregar material"
                              >
                                <FileText className="w-5 h-5 text-indigo-300" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingLessonId(lesson.lesson_id)
                                  setShowActivityModal(true)
                                }}
                                className="rounded-lg bg-purple-900/30 p-2.5 hover:bg-purple-800/40"
                                title="Agregar actividad"
                              >
                                <ClipboardList className="w-5 h-5 text-purple-300" />
                              </button>
                            </div>
                          </div>

                          {expandedLessons.has(lesson.lesson_id) && (
                            <div className="p-4 border-t border-purple-800/30 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gray-900/40 rounded-lg p-4 border border-purple-800/30">
                                <div className="flex items-center justify-between mb-3 text-purple-200 font-semibold text-sm">
                                  <span>Materiales</span>
                                  <button
                                    onClick={() => {
                                      setEditingLessonId(lesson.lesson_id)
                                      setShowMaterialModal(true)
                                    }}
                                    className="text-xs text-indigo-300 hover:text-indigo-200"
                                  >
                                    + Agregar
                                  </button>
                                </div>
                                {materials.filter((m) => m.lesson_id === lesson.lesson_id).length === 0 ? (
                                  <p className="text-xs text-purple-300/70">No hay materiales</p>
                                ) : (
                                  <div className="space-y-2 text-xs text-purple-200">
                                    {materials.filter((m) => m.lesson_id === lesson.lesson_id).map((m) => (
                                      <div key={m.material_id} className="p-3 rounded-lg bg-indigo-900/20 border border-indigo-800/30">
                                        <div className="font-medium text-white">{m.material_title}</div>
                                        <div className="text-purple-300/80 mt-1">{m.material_type}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="bg-gray-900/40 rounded-lg p-4 border border-purple-800/30">
                                <div className="flex items-center justify-between mb-3 text-purple-200 font-semibold text-sm">
                                  <span>Actividades</span>
                                  <button
                                    onClick={() => {
                                      setEditingLessonId(lesson.lesson_id)
                                      setShowActivityModal(true)
                                    }}
                                    className="text-xs text-purple-300 hover:text-purple-200"
                                  >
                                    + Agregar
                                  </button>
                                </div>
                                {activities.filter((a) => a.lesson_id === lesson.lesson_id).length === 0 ? (
                                  <p className="text-xs text-purple-300/70">No hay actividades</p>
                                ) : (
                                  <div className="space-y-2 text-xs">
                                    {activities.filter((a) => a.lesson_id === lesson.lesson_id).map((a) => (
                                      <div key={a.activity_id} className="p-3 rounded-lg bg-gray-900/60 border border-purple-700/40 flex items-center justify-between">
                                        <div>
                                          <div className="font-semibold text-white">{a.activity_title}</div>
                                          <div className="text-purple-200 mt-1">{a.activity_type}</div>
                                        </div>
                                        <button
                                          onClick={() => {
                                            setEditingLessonId(lesson.lesson_id)
                                            setEditingActivityId(a.activity_id)
                                            setShowActivityModal(true)
                                          }}
                                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white"
                                          title="Editar actividad"
                                        >
                                          <Edit3 className="w-4 h-4" />
                                          Editar
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
      )}
    </div>
  )
}
