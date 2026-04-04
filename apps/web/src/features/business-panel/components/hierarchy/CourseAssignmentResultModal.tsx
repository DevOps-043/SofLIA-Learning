import { X, CheckCircle2, AlertCircle } from 'lucide-react'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'

interface CourseResult {
  course_id: string
  course_title?: string
  success: boolean
  assigned_count?: number
  already_assigned_count?: number
  error?: string
  message?: string
}

interface CourseAssignmentResultModalProps {
  isOpen: boolean
  onClose: () => void
  success: boolean
  message: string
  entityName: string
  totalUsers: number
  results: CourseResult[]
}

export function CourseAssignmentResultModal({
  isOpen,
  onClose,
  success,
  message,
  entityName,
  totalUsers,
  results
}: CourseAssignmentResultModalProps) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const primaryColor = panelStyles?.primary_button_color || '#0A2540'
  const accentColor = panelStyles?.accent_color || '#00D4B3'

  if (!isOpen) return null

  const totalAssigned = results.reduce((acc: number, r: { assigned_count?: number; success?: boolean }) => acc + (r.assigned_count || 0), 0)
  const successfulResults = results.filter(r => r.success)
  const failedResults = results.filter(r => !r.success)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1E2329] rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {success ? (
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            )}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {success ? 'Asignación Exitosa' : 'Error en la Asignación'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Main Message */}
            <div className={`p-4 rounded-xl ${
              success 
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' 
                : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20'
            }`}>
              <p className={`font-medium ${
                success 
                  ? 'text-emerald-800 dark:text-emerald-300' 
                  : 'text-red-800 dark:text-red-300'
              }`}>
                {message}
              </p>
            </div>

            {/* Summary */}
            {success && (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-white/50 mb-1">Total de Cursos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{results.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-white/50 mb-1">Usuarios Afectados</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalUsers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-white/50 mb-1">Nuevas Asignaciones</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalAssigned}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-white/50 mb-1">Entidad</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{entityName}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Course Results */}
            {results.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Detalle de Cursos Procesados:
                </h3>
                <div className="space-y-2">
                  {results.map((result, idx) => (
                    <div
                      key={result.course_id || idx}
                      className={`p-3 rounded-lg border ${
                        result.success
                          ? 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10'
                          : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`font-medium ${
                            result.success
                              ? 'text-gray-900 dark:text-white'
                              : 'text-red-800 dark:text-red-300'
                          }`}>
                            {result.course_title || result.course_id}
                          </p>
                          {result.success ? (
                            <div className="mt-1 flex items-center gap-4 text-sm">
                              {result.assigned_count !== undefined && result.assigned_count > 0 && (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  ✓ {result.assigned_count} nuevos
                                </span>
                              )}
                              {result.already_assigned_count !== undefined && result.already_assigned_count > 0 && (
                                <span className="text-gray-500 dark:text-white/50">
                                  {result.already_assigned_count} ya tenían
                                </span>
                              )}
                              {result.assigned_count === 0 && result.already_assigned_count === 0 && (
                                <span className="text-gray-500 dark:text-white/50">
                                  {result.message || 'Sin cambios'}
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                              {result.error || 'Error desconocido'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Failed Results Summary */}
            {failedResults.length > 0 && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                  {failedResults.length} curso(s) no pudieron ser asignados
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-white font-medium shadow-lg cursor-pointer hover:shadow-xl hover:translate-y-[-1px] transition-all drop-shadow-md"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

