'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Upload, Image as ImageIcon, Loader2 } from 'lucide-react'
import type { AdminSkill, CreateSkillData, UpdateSkillData } from '../../services/adminSkills.service'
import { SkillBadgeUpload } from '../SkillBadgeUpload'
import { useSkillFormState, CATEGORIES, CATEGORY_LABELS, LEVELS, LEVEL_LABELS } from './useSkillFormState'

interface SkillModalProps {
  isOpen: boolean
  onClose: () => void
  skill: AdminSkill | null
  onSave: (skillData: CreateSkillData | UpdateSkillData) => Promise<void>
}

export function SkillModal({ isOpen, onClose, skill, onSave }: SkillModalProps) {
  const {
    formData, setFormData, isSaving, error, setError,
    badges, loadingBadges, iconPreview, setIconPreview,
    uploadingIcon, iconFileInputRef,
    handleNameChange, handleIconUpload, handleBadgeChange, handleSubmit
  } = useSkillFormState({ skill, isOpen, onSave })

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {skill ? 'Editar Skill' : 'Nueva Skill'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nivel
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {LEVELS.map(level => (
                    <option key={level} value={level}>{LEVEL_LABELS[level]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Icon Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icono de la Skill *
              </label>

              {iconPreview || formData.icon_url ? (
                <div className="space-y-3">
                  <div className="relative w-32 h-32 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={iconPreview || formData.icon_url}
                      alt="Icono de skill"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex gap-2">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      {uploadingIcon ? 'Subiendo...' : 'Cambiar'}
                      <input
                        ref={iconFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleIconUpload(file)
                        }}
                        disabled={uploadingIcon || !formData.slug}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        if (skill?.skill_id && formData.icon_url) {
                          try {
                            const response = await fetch(`/api/admin/skills/${skill.skill_id}/icon`, {
                              method: 'DELETE',
                              credentials: 'include'
                            })
                            const data = await response.json()
                            if (!response.ok || !data.success) {
                              throw new Error(data.error || 'Error al eliminar el icono')
                            }
                          } catch (error) {
                            setError(error instanceof Error ? error.message : 'Error al eliminar el icono')
                            return
                          }
                        }
                        setIconPreview(null)
                        setFormData(prev => ({ ...prev, icon_url: '' }))
                        if (iconFileInputRef.current) iconFileInputRef.current.value = ''
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                  {uploadingIcon && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Subiendo icono...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Sube una imagen para el icono de la skill
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                      Formatos: PNG, JPEG, JPG, GIF, WebP, SVG (máx. 5MB)
                    </p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      Subir Imagen
                      <input
                        ref={iconFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleIconUpload(file)
                        }}
                        disabled={uploadingIcon || !formData.slug}
                      />
                    </label>
                    {!formData.slug && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        Primero debes crear un slug para poder subir el icono
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Badge Upload */}
            {formData.slug && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <SkillBadgeUpload
                  skillId={skill?.skill_id || null}
                  skillSlug={formData.slug}
                  badges={badges}
                  onBadgeChange={handleBadgeChange}
                  disabled={isSaving || loadingBadges || !formData.slug}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orden de Visualización
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Activa</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Destacada</span>
                </label>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
