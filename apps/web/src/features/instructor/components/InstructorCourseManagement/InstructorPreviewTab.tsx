import { motion } from 'framer-motion'
import { Book, Eye } from 'lucide-react'
import type { InstructorPreviewTabProps } from './types'

export function InstructorPreviewTab({ workshopPreview, previewLoading }: InstructorPreviewTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-6"
    >
      {previewLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-[#00D4B3]/20 border-t-[#00D4B3] rounded-full mb-4"
          />
          <p className="text-[#6C757D] dark:text-white/60 text-sm font-medium">Cargando vista previa...</p>
        </div>
      ) : workshopPreview ? (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative group"
          >
            <div className="relative rounded-2xl overflow-hidden border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329] shadow-lg hover:shadow-2xl transition-all duration-500">
              <div className="relative h-80 overflow-hidden">
                {workshopPreview.thumbnail_url ? (
                  <>
                    <motion.img
                      src={workshopPreview.thumbnail_url}
                      alt={workshopPreview.title}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.6 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A2540]/90 via-[#0A2540]/40 to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0A2540] via-[#0A2540]/90 to-[#00D4B3]/20 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="text-[#00D4B3]/30 text-9xl"
                    >
                      📚
                    </motion.div>
                  </div>
                )}

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute top-6 left-6"
                >
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00D4B3]/90 backdrop-blur-md text-white text-sm font-semibold shadow-lg">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    {workshopPreview.category || 'Curso'}
                  </span>
                </motion.div>

                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute top-6 right-6"
                >
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md text-white text-sm font-semibold shadow-lg ${
                    workshopPreview.level === 'beginner' ? 'bg-[#10B981]/90' :
                    workshopPreview.level === 'intermediate' ? 'bg-[#F59E0B]/90' :
                    'bg-[#0A2540]/90'
                  }`}>
                    {workshopPreview.level === 'beginner' ? '🌱 Principiante' :
                      workshopPreview.level === 'intermediate' ? '📈 Intermedio' :
                      '🚀 Avanzado'}
                  </span>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-0 left-0 right-0 p-8"
                >
                  <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-2xl">{workshopPreview.title}</h1>
                  <p className="text-white/90 text-lg leading-relaxed drop-shadow-lg line-clamp-2">{workshopPreview.description}</p>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-8 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center">
                    <Book className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white">Sobre este curso</h2>
                </div>
                <p className="text-[#6C757D] dark:text-white/70 leading-relaxed text-base">{workshopPreview.description}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: '⏱️', label: 'Duración', value: `${workshopPreview.duration_total_minutes} min`, color: 'from-[#00D4B3] to-[#10B981]' },
                  { icon: '📊', label: 'Nivel', value: workshopPreview.level === 'beginner' ? 'Principiante' : workshopPreview.level === 'intermediate' ? 'Intermedio' : 'Avanzado', color: 'from-[#0A2540] to-[#00D4B3]' },
                  { icon: '🎯', label: 'Categoría', value: workshopPreview.category || 'General', color: 'from-[#10B981] to-[#00D4B3]' },
                  { icon: '💰', label: 'Precio', value: workshopPreview.price > 0 ? `$${workshopPreview.price}` : 'Gratis', color: 'from-[#F59E0B] to-[#10B981]' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="relative group"
                  >
                    <div className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                      <div className="relative">
                        <div className="text-3xl mb-2">{stat.icon}</div>
                        <div className="text-xs font-semibold text-[#6C757D] dark:text-white/60 uppercase tracking-wide mb-1">{stat.label}</div>
                        <div className="text-lg font-bold text-[#0A2540] dark:text-white">{stat.value}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-4"
            >
              <div className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-6 shadow-sm sticky top-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00D4B3] to-[#10B981] flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Vista Previa</h3>
                  </div>

                  <motion.button
                    onClick={() => { if (workshopPreview.slug) window.open(`/courses/${workshopPreview.slug}`, '_blank') }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative w-full px-6 py-4 bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 hover:from-[#0d2f4d] hover:to-[#0A2540] text-white rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-[#0A2540]/20 hover:shadow-xl hover:shadow-[#0A2540]/30 transition-all duration-300 overflow-hidden font-semibold"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00D4B3]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Eye className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Ver Página Pública</span>
                  </motion.button>

                  <div className="pt-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#6C757D] dark:text-white/60">Estado</span>
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/10 dark:bg-[#10B981]/20 text-[#10B981] text-xs font-semibold">
                        <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
                        Publicado
                      </span>
                    </div>
                    {workshopPreview.slug && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#6C757D] dark:text-white/60">URL</span>
                        <code className="px-2 py-1 rounded bg-[#E9ECEF] dark:bg-[#0A0D12] text-[#00D4B3] text-xs font-mono">
                          /{workshopPreview.slug}
                        </code>
                      </div>
                    )}
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-6 p-4 rounded-xl bg-[#00D4B3]/5 dark:bg-[#00D4B3]/10 border border-[#00D4B3]/20"
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#00D4B3]/20 flex items-center justify-center">
                        <span className="text-lg">💡</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#0A2540] dark:text-white mb-1">Vista Previa en Tiempo Real</p>
                        <p className="text-xs text-[#6C757D] dark:text-white/60 leading-relaxed">
                          Esta es una vista previa de cómo se verá tu curso para los estudiantes.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-32 bg-white dark:bg-[#1E2329] rounded-2xl border-2 border-dashed border-[#E9ECEF] dark:border-[#6C757D]/30"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0A2540]/10 to-[#00D4B3]/10 dark:from-[#0A2540]/20 dark:to-[#00D4B3]/20 flex items-center justify-center mb-6">
            <Eye className="w-10 h-10 text-[#6C757D] dark:text-white/40" />
          </div>
          <p className="text-[#0A2540] dark:text-white text-lg font-semibold mb-2">No se encontró el curso</p>
          <p className="text-[#6C757D] dark:text-white/60 text-sm">Guarda la configuración primero para ver la vista previa</p>
        </motion.div>
      )}
    </motion.div>
  )
}
