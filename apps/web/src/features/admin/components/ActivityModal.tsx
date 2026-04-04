'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { Plus, Trash2, ClipboardList, Brain, Lightbulb, FileQuestion, MessageSquare, Bot, Clock } from 'lucide-react'
import type { AdminActivity, CreateActivityData } from '../services/adminActivities.service'

interface ActivityModalProps {
  activity?: AdminActivity | null
  lessonId: string
  onClose: () => void
  onSave: (data: CreateActivityData) => Promise<void>
}

type TabType = 'basic' | 'content'
type ActivityType = AdminActivity['activity_type']

interface ActivityFormData extends CreateActivityData {
  activity_description: string
  ai_prompts: string
  estimated_time_minutes: number
  is_required: boolean
}

function isActivityType(value: string): value is ActivityType {
  return (
    value === 'reflection' ||
    value === 'exercise' ||
    value === 'quiz' ||
    value === 'discussion' ||
    value === 'ai_chat'
  )
}

export function ActivityModal({ activity, lessonId: _lessonId, onClose, onSave }: ActivityModalProps) {
  const [formData, setFormData] = useState<ActivityFormData>({
    activity_title: '',
    activity_description: '',
    activity_type: 'reflection',
    activity_content: '',
    ai_prompts: '',
    is_required: false,
    estimated_time_minutes: 5 // Default 5 minutes
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('basic')
  const [aiPromptsList, setAiPromptsList] = useState<string[]>([''])

  const tabs: { id: TabType; label: string; icon: typeof ClipboardList }[] = [
    { id: 'basic', label: 'Básica', icon: ClipboardList },
    { id: 'content', label: 'Contenido', icon: Brain }
  ]

  const getActivityTypeIcon = () => {
    switch (formData.activity_type) {
      case 'reflection':
        return Lightbulb
      case 'exercise':
        return ClipboardList
      case 'quiz':
        return FileQuestion
      case 'discussion':
        return MessageSquare
      case 'ai_chat':
        return Bot
      default:
        return ClipboardList
    }
  }

  const ActivityTypeIcon = getActivityTypeIcon()

  useEffect(() => {
    if (activity) {
      setFormData({
        activity_title: activity.activity_title,
        activity_description: activity.activity_description || '',
        activity_type: activity.activity_type,
        activity_content: activity.activity_content,
        ai_prompts: activity.ai_prompts || '',
        is_required: activity.is_required,
        estimated_time_minutes: activity.estimated_time_minutes || 5
      })
      // Intentar inicializar lista de prompts desde JSON o texto separado por nuevas líneas
      if (activity.ai_prompts) {
        try {
          const parsed = JSON.parse(activity.ai_prompts)
          if (Array.isArray(parsed) && parsed.every(p => typeof p === 'string')) {
            setAiPromptsList(parsed.length > 0 ? parsed : [''])
          } else {
            setAiPromptsList(activity.ai_prompts.split('\n').filter(Boolean))
          }
        } catch {
          setAiPromptsList(activity.ai_prompts.split('\n').filter(Boolean))
        }
      } else {
        setAiPromptsList([''])
      }
    }
  }, [activity])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const payload = { ...formData }
      if (formData.activity_type === 'ai_chat') {
        const normalized = aiPromptsList.map(p => p.trim()).filter(p => p.length > 0)
        payload.ai_prompts = JSON.stringify(normalized)
      }
      await onSave(payload)
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al guardar la actividad'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {true && (
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
                className="relative bg-white dark:bg-[#1E2329] rounded-2xl shadow-2xl max-w-4xl w-full border border-[#E9ECEF] dark:border-[#6C757D]/30 max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header Rediseñado */}
                <div className="relative bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 dark:from-[#0A2540] dark:to-[#0A2540]/80 px-6 py-4 border-b border-[#0A2540]/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#00D4B3]/20 flex items-center justify-center">
                        <ClipboardList className="h-5 w-5 text-[#00D4B3]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {activity ? 'Editar Actividad' : 'Crear Actividad'}
                        </h3>
                        <p className="text-xs text-white/70">
                          {activity ? 'Modifica la información de la actividad' : 'Agrega una nueva actividad a la lección'}
                        </p>
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
                <div className="flex items-center gap-1 px-6 py-3 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
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
                            ? 'text-[#00D4B3] bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20'
                            : 'text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329]'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 rounded-xl bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 -z-10"
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
                            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                              Título de la Actividad *
                            </label>
                            <div className="relative">
                              <ClipboardList className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                              <input
                                type="text"
                                required
                                value={formData.activity_title}
                                onChange={(e) => setFormData(prev => ({ ...prev, activity_title: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                                placeholder="Ej: Reflexión sobre IA"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                              Descripción
                            </label>
                            <textarea
                              rows={3}
                              value={formData.activity_description}
                              onChange={(e) => setFormData(prev => ({ ...prev, activity_description: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none"
                              placeholder="Descripción de la actividad..."
                            />
                          </div>

                          <div className="group">
                            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                              Tipo de Actividad *
                            </label>
                            <div className="relative">
                              <ActivityTypeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                              <select
                                value={formData.activity_type}
                                onChange={(e) => {
                                  const nextType = e.target.value
                                  if (!isActivityType(nextType)) {
                                    return
                                  }

                                  setFormData(prev => ({ ...prev, activity_type: nextType }))
                                }}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                              >
                                <option value="reflection">Reflexión</option>
                                <option value="exercise">Ejercicio</option>
                                <option value="quiz">Quiz</option>
                                <option value="discussion">Discusión</option>
                                <option value="ai_chat">Chat con IA</option>
                              </select>
                            </div>
                          </div>

                          <div className="group">
                            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                              Tiempo Estimado (minutos) *
                            </label>
                            <div className="relative">
                              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <input
                                type="number"
                                required
                                min="1"
                                max="480"
                                value={formData.estimated_time_minutes}
                                onChange={(e) => setFormData(prev => ({ ...prev, estimated_time_minutes: parseInt(e.target.value) || 1 }))}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                                placeholder="Ej: 10"
                              />
                            </div>
                            <p className="text-xs text-[#6C757D] dark:text-white/60 mt-1.5 ml-1">
                              Tiempo que tomará completar esta actividad. Mínimo 1 minuto, máximo 480 minutos (8 horas).
                              <span className="flex items-center gap-1.5 mt-1 text-[#00D4B3] font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                Requerido para el Planificador de Estudio IA
                              </span>
                            </p>
                          </div>

                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            className="p-4 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30"
                          >
                            <label className="flex items-center gap-3 cursor-pointer">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={formData.is_required}
                                  onChange={(e) => setFormData(prev => ({ ...prev, is_required: e.target.checked }))}
                                  className="sr-only"
                                />
                                <motion.div
                                  animate={{
                                    backgroundColor: formData.is_required ? '#00D4B3' : '#E9ECEF',
                                    borderColor: formData.is_required ? '#00D4B3' : '#E9ECEF'
                                  }}
                                  className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200"
                                >
                                  {formData.is_required && (
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
                                <span className="text-sm font-medium text-[#0A2540] dark:text-white">
                                  Actividad Requerida
                                </span>
                                <p className="text-xs text-[#6C757D] dark:text-white/60 mt-0.5">
                                  Los estudiantes deben completar esta actividad para avanzar
                                </p>
                              </div>
                            </label>
                          </motion.div>
                        </motion.div>
                      )}

                      {/* Tab: Contenido */}
                      {activeTab === 'content' && (
                        <motion.div
                          key="content"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                              Contenido de la Actividad *
                            </label>
                            <textarea
                              rows={8}
                              required
                              value={formData.activity_content}
                              onChange={(e) => setFormData(prev => ({ ...prev, activity_content: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none"
                              placeholder="Instrucciones o contenido de la actividad..."
                            />
                          </div>

                          {/* AI Prompts múltiples (solo ai_chat) */}
                          {formData.activity_type === 'ai_chat' && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 uppercase tracking-wide">
                                  Prompts de IA
                                </label>
                                <motion.button
                                  type="button"
                                  onClick={() => setAiPromptsList(prev => [...prev, ''])}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 hover:bg-[#00D4B3]/20 dark:hover:bg-[#00D4B3]/30 text-[#00D4B3] text-xs font-medium border border-[#00D4B3]/20 dark:border-[#00D4B3]/30 transition-all duration-200"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Agregar prompt
                                </motion.button>
                              </div>
                              <div className="space-y-2">
                                {aiPromptsList.map((prompt, idx) => (
                                  <div key={idx} className="flex items-start gap-2">
                                    <textarea
                                      rows={2}
                                      value={prompt}
                                      onChange={(e) => {
                                        const value = e.target.value
                                        setAiPromptsList(prev => prev.map((p, i) => (i === idx ? value : p)))
                                      }}
                                      className="flex-1 px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none"
                                      placeholder={`Prompt #${idx + 1}`}
                                    />
                                    <motion.button
                                      type="button"
                                      onClick={() => setAiPromptsList(prev => prev.filter((_, i) => i !== idx))}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="mt-0.5 px-2.5 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 transition-all duration-200"
                                      title="Eliminar"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </motion.button>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-[#6C757D] dark:text-white/60 mt-2">Se guardarán como lista JSON. El sistema usará uno o varios según la lógica de la actividad.</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-[#E9ECEF]/30 dark:bg-[#0A0D12] border-t border-[#E9ECEF] dark:border-[#6C757D]/30 flex items-center justify-end gap-3">
                    <motion.button
                      type="button"
                      onClick={onClose}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 text-sm font-medium text-[#6C757D] dark:text-white/60 bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 transition-all duration-200"
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 hover:from-[#0d2f4d] hover:to-[#0A2540] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4" />
                          <span>Guardar</span>
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
