'use client'

import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  XMarkIcon,
  BookOpenIcon,
  PlusIcon,
  UserCircleIcon,
  ClockIcon,
  TagIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  LinkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useAddWorkshopFormState } from './useAddWorkshopFormState'

interface AddWorkshopModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => Promise<void>
}

type TabType = 'basic' | 'details' | 'media'

const AddWorkshopMediaTab = dynamic(
  () => import('./AddWorkshopMediaTab').then((module) => ({ default: module.AddWorkshopMediaTab })),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 animate-pulse rounded-xl border border-gray-200 bg-gray-100/70 dark:border-gray-700/30 dark:bg-gray-900" />
    ),
  },
)

const tabs: { id: TabType; label: string; icon: typeof BookOpenIcon }[] = [
  { id: 'basic', label: 'Básica', icon: BookOpenIcon },
  { id: 'details', label: 'Detalles', icon: TagIcon },
  { id: 'media', label: 'Media', icon: PhotoIcon }
]

export function AddWorkshopModal({ isOpen, onClose, onSave }: AddWorkshopModalProps) {
  const {
    formData, setFormData, instructors, isLoading, error, errors,
    activeTab, setActiveTab, handleChange, handleSubmit
  } = useAddWorkshopFormState({ isOpen, onSave, onClose })

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 dark:border-gray-700/30 max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="relative border-b border-primary/20 bg-gradient-to-r from-primary to-primary/90 px-6 py-4 dark:to-primary/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                        <PlusIcon className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Crear Nuevo Taller</h3>
                        <p className="text-xs text-white/70">Agrega un nuevo taller a la plataforma</p>
                      </div>
                    </div>
                    <motion.button
                      onClick={onClose}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 px-6 py-3 bg-gray-100/50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/30">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'text-accent bg-accent/10 dark:bg-accent/20'
                            : 'text-gray-500 dark:text-white/60 hover:text-primary dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 rounded-xl bg-accent/10 dark:bg-accent/20 -z-10"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 dark:border-red-500/30 rounded-xl"
                      >
                        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                      </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                      {/* Tab: Básica */}
                      {activeTab === 'basic' && (
                        <motion.div
                          key="basic"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <div className="group">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
                              Título del Taller *
                            </label>
                            <div className="relative">
                              <BookOpenIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-white/60 group-focus-within:text-accent transition-colors" />
                              <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200"
                                placeholder="Ej: Introducción a la Inteligencia Artificial"
                                required
                              />
                            </div>
                            {errors.title && (
                              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.title}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
                              Descripción *
                            </label>
                            <textarea
                              name="description"
                              value={formData.description}
                              onChange={handleChange}
                              rows={4}
                              className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200 resize-none"
                              placeholder="Describe el contenido y objetivos del taller..."
                              required
                            />
                            {errors.description && (
                              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.description}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="group">
                              <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Instructor *
                              </label>
                              <div className="relative">
                                <UserCircleIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-white/60 group-focus-within:text-accent transition-colors pointer-events-none" />
                                <select
                                  name="instructor_id"
                                  value={formData.instructor_id}
                                  onChange={handleChange}
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/30 rounded-xl text-primary dark:text-white focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                                  required
                                >
                                  <option value="">Seleccionar instructor</option>
                                  {instructors.map(instructor => (
                                    <option key={instructor.id} value={instructor.id}>
                                      {instructor.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              {errors.instructor_id && (
                                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.instructor_id}</p>
                              )}
                            </div>

                            <div className="group">
                              <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Duración (minutos) *
                              </label>
                              <div className="relative">
                                <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-white/60 group-focus-within:text-accent transition-colors" />
                                <input
                                  type="number"
                                  name="duration_total_minutes"
                                  value={formData.duration_total_minutes}
                                  onChange={handleChange}
                                  min="1"
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200"
                                  required
                                />
                              </div>
                              {errors.duration_total_minutes && (
                                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.duration_total_minutes}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Tab: Detalles */}
                      {activeTab === 'details' && (
                        <motion.div
                          key="details"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Categoría *
                              </label>
                              <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/30 rounded-xl text-primary dark:text-white focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200"
                              >
                                <option value="ia">Inteligencia Artificial</option>
                                <option value="tecnologia">Tecnología</option>
                                <option value="negocios">Negocios</option>
                                <option value="diseño">Diseño</option>
                                <option value="marketing">Marketing</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Nivel *
                              </label>
                              <select
                                name="level"
                                value={formData.level}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/30 rounded-xl text-primary dark:text-white focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200"
                              >
                                <option value="beginner">Principiante</option>
                                <option value="intermediate">Intermedio</option>
                                <option value="advanced">Avanzado</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="group">
                              <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Precio
                              </label>
                              <div className="relative">
                                <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-white/60 group-focus-within:text-accent transition-colors" />
                                <input
                                  type="number"
                                  name="price"
                                  value={formData.price}
                                  onChange={handleChange}
                                  min="0"
                                  step="0.01"
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Slug (URL amigable) *
                              </label>
                              <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-white/60 pointer-events-none" />
                                <input
                                  type="text"
                                  name="slug"
                                  value={formData.slug}
                                  onChange={handleChange}
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/30 rounded-xl text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all duration-200"
                                  placeholder="introduccion-ia"
                                  required
                                />
                              </div>
                              {errors.slug && (
                                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.slug}</p>
                              )}
                            </div>
                          </div>

                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            className="p-4 bg-gray-100/50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700/30"
                          >
                            <label className="flex items-center gap-3 cursor-pointer">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  name="is_active"
                                  checked={formData.is_active}
                                  onChange={handleChange}
                                  className="sr-only"
                                />
                                <motion.div
                                  animate={{
                                    backgroundColor: formData.is_active ? 'var(--color-accent)' : 'var(--color-gray-200)',
                                    borderColor: formData.is_active ? 'var(--color-accent)' : 'var(--color-gray-200)'
                                  }}
                                  className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200"
                                >
                                  {formData.is_active && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    >
                                      <CheckCircleIcon className="h-4 w-4 text-white" />
                                    </motion.div>
                                  )}
                                </motion.div>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-primary dark:text-white">
                                  Taller activo
                                </span>
                                <p className="text-xs text-gray-500 dark:text-white/60 mt-0.5">
                                  El taller será visible para los estudiantes
                                </p>
                              </div>
                            </label>
                          </motion.div>
                        </motion.div>
                      )}

                      {/* Tab: Media */}
                      {activeTab === 'media' && (
                        <motion.div
                          key="media"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <AddWorkshopMediaTab
                            thumbnailUrl={formData.thumbnail_url}
                            onThumbnailChange={(url) => setFormData(prev => ({ ...prev, thumbnail_url: url }))}
                            disabled={isLoading}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-gray-100/30 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700/30 flex items-center justify-end gap-3">
                    <motion.button
                      type="button"
                      onClick={onClose}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-2.5 text-gray-500 dark:text-white/70 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-primary/30 rounded-xl text-sm font-medium transition-colors duration-200 border border-gray-200 dark:border-gray-700/30"
                      disabled={isLoading}
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Creando...</span>
                        </>
                      ) : (
                        <>
                          <PlusIcon className="h-4 w-4" />
                          <span>Crear Taller</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
