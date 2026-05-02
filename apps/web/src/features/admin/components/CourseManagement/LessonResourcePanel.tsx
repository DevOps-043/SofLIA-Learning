'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, ClipboardList, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCourseManagementContext } from './CourseManagementContext'
import type { AdminMaterial } from '../../services/adminMaterials.service'
import type { AdminActivity } from '../../services/adminActivities.service'

interface LessonResourcePanelProps {
  lessonId: string
  materials: AdminMaterial[]
  activities: AdminActivity[]
}

export function LessonResourcePanel({ lessonId, materials, activities }: LessonResourcePanelProps) {
  const {
    setEditingLessonId, setShowMaterialModal, setEditingMaterial,
    setShowActivityModal, setEditingActivity,
    deleteMaterial, fetchMaterials,
    deleteActivity, fetchActivities,
  } = useCourseManagementContext().state
  const { t } = useTranslation('common')
  const { t: ta } = useTranslation('admin')

  const [pendingDeleteMaterial, setPendingDeleteMaterial] = useState<string | null>(null)
  const [pendingDeleteActivity, setPendingDeleteActivity] = useState<string | null>(null)

  const handleConfirmDeleteMaterial = async () => {
    if (!pendingDeleteMaterial) return
    const id = pendingDeleteMaterial
    try {
      setPendingDeleteMaterial(null)
      await deleteMaterial(id)
      showFeedbackMessage('success', 'Material eliminado correctamente')
      await fetchMaterials(lessonId)
    } catch (error) {
      showFeedbackMessage(
        'error',
        error instanceof Error ? error.message : 'Error al eliminar el material',
      )
    }
  }

  const handleConfirmDeleteActivity = async () => {
    if (!pendingDeleteActivity) return
    const id = pendingDeleteActivity
    try {
      setPendingDeleteActivity(null)
      await deleteActivity(id)
      showFeedbackMessage('success', 'Actividad eliminada correctamente')
      await fetchActivities(lessonId)
    } catch (error) {
      showFeedbackMessage(
        'error',
        error instanceof Error ? error.message : 'Error al eliminar la actividad',
      )
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
      {/* Materiales */}
      <div className="bg-white dark:bg-[#1E2329] rounded-lg p-3 border border-[#E9ECEF] dark:border-[#6C757D]/30">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-xs font-bold text-[#0A2540] dark:text-white flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#0A2540] dark:text-[#00D4B3]" />
            {ta('courseManagement.materialsLabel')}
            <span className="px-1.5 py-0.5 bg-[#0A2540]/10 dark:bg-[#00D4B3]/20 text-[#0A2540] dark:text-[#00D4B3] rounded text-xs font-semibold">
              {materials.length}
            </span>
          </h5>
          <motion.button
            onClick={() => { setEditingLessonId(lessonId); setShowMaterialModal(true) }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-xs font-semibold text-[#00D4B3] hover:text-[#00D4B3]/80 transition-colors"
          >
            {ta('courseManagement.addButton')}
          </motion.button>
        </div>

        {pendingDeleteMaterial && (
          <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between gap-2">
            <p className="text-xs text-red-700 dark:text-red-400">{ta('courseManagement.confirmDeleteMaterial')}</p>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => setPendingDeleteMaterial(null)} className="px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded hover:bg-red-50 transition-colors">{t('actions.cancel')}</button>
              <button onClick={handleConfirmDeleteMaterial} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors">{t('actions.delete')}</button>
            </div>
          </div>
        )}

        {materials.length === 0 ? (
          <p className="text-xs text-[#6C757D] dark:text-white/40 italic text-center py-3">{ta('courseManagement.noMaterials')}</p>
        ) : (
          <div className="space-y-1.5">
            {materials.map(material => (
              <motion.div
                key={material.material_id}
                whileHover={{ x: 2 }}
                className="text-xs p-2 bg-gradient-to-r from-[#0A2540]/5 to-[#0A2540]/10 dark:from-[#0A2540]/20 dark:to-[#0A2540]/10 rounded-lg border border-[#0A2540]/10 dark:border-[#0A2540]/30 flex items-center justify-between group"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#0A2540] dark:text-white truncate">{material.material_title}</div>
                  <div className="text-[#6C757D] dark:text-white/60 text-xs mt-0.5">{material.material_type}</div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <motion.button
                    onClick={() => { setEditingMaterial(material); setEditingLessonId(lessonId); setShowMaterialModal(true) }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1 bg-[#10B981]/10 dark:bg-[#10B981]/20 hover:bg-[#10B981]/20 rounded transition-colors"
                    title={t('actions.edit')}
                  >
                    <Pencil className="w-3 h-3 text-[#10B981]" />
                  </motion.button>
                  <motion.button
                    onClick={() => setPendingDeleteMaterial(material.material_id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    title={t('actions.delete')}
                  >
                    <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Actividades */}
      <div className="bg-white dark:bg-[#1E2329] rounded-lg p-3 border border-[#E9ECEF] dark:border-[#6C757D]/30">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-xs font-bold text-[#0A2540] dark:text-white flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5 text-[#00D4B3]" />
            {ta('courseManagement.activitiesLabel')}
            <span className="px-1.5 py-0.5 bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 text-[#00D4B3] rounded text-xs font-semibold">
              {activities.length}
            </span>
          </h5>
          <motion.button
            onClick={() => { setEditingLessonId(lessonId); setShowActivityModal(true) }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-xs font-semibold text-[#00D4B3] hover:text-[#00D4B3]/80 transition-colors"
          >
            {ta('courseManagement.addButton')}
          </motion.button>
        </div>

        {pendingDeleteActivity && (
          <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between gap-2">
            <p className="text-xs text-red-700 dark:text-red-400">{ta('courseManagement.confirmDeleteActivity')}</p>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => setPendingDeleteActivity(null)} className="px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded hover:bg-red-50 transition-colors">{t('actions.cancel')}</button>
              <button onClick={handleConfirmDeleteActivity} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors">{t('actions.delete')}</button>
            </div>
          </div>
        )}

        {activities.length === 0 ? (
          <p className="text-xs text-[#6C757D] dark:text-white/40 italic text-center py-3">{ta('courseManagement.noActivities')}</p>
        ) : (
          <div className="space-y-1.5">
            {activities.map(activity => (
              <motion.div
                key={activity.activity_id}
                whileHover={{ x: 2 }}
                className="text-xs p-2 bg-gradient-to-r from-[#00D4B3]/5 to-[#00D4B3]/10 dark:from-[#00D4B3]/20 dark:to-[#00D4B3]/10 rounded-lg border border-[#00D4B3]/10 dark:border-[#00D4B3]/30 flex items-center justify-between group"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#0A2540] dark:text-white truncate">{activity.activity_title}</div>
                  <div className="text-[#6C757D] dark:text-white/60 text-xs mt-0.5">{activity.activity_type}</div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <motion.button
                    onClick={() => { setEditingActivity(activity); setEditingLessonId(lessonId); setShowActivityModal(true) }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1 bg-[#10B981]/10 dark:bg-[#10B981]/20 hover:bg-[#10B981]/20 rounded transition-colors"
                    title={t('actions.edit')}
                  >
                    <Pencil className="w-3 h-3 text-[#10B981]" />
                  </motion.button>
                  <motion.button
                    onClick={() => setPendingDeleteActivity(activity.activity_id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    title={t('actions.delete')}
                  >
                    <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
