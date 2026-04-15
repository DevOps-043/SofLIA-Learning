'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AdminSkill } from '../services/adminSkills.service'

interface DeleteSkillModalProps {
  isOpen: boolean
  onClose: () => void
  skill: AdminSkill
  onConfirm: () => Promise<void>
}

export function DeleteSkillModal({ isOpen, onClose, skill, onConfirm }: DeleteSkillModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  const handleConfirm = async () => {
    try {
      setIsDeleting(true)
      await onConfirm()
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('skills.deleteModal.title')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t('skills.deleteModal.confirmText', { name: skill.name })}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('skills.deleteModal.warningText')}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {tc('actions.cancel')}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? tc('actions.deleting') : tc('actions.delete')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
