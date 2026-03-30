'use client'

import { X, AlertTriangle, Trash2 } from 'lucide-react'
import { AdminReel } from '../services/adminReels.service'

interface DeleteReelModalProps {
  reel: AdminReel
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeleteReelModal({ reel, onClose, onConfirm }: DeleteReelModalProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm()
    } catch (error) {
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-gray-600/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Eliminar Reel</h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                ¿Estás seguro de que quieres eliminar este reel?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Esta acción no se puede deshacer. Se eliminarán todos los datos asociados al reel.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <img
                src={reel.thumbnail_url}
                alt={reel.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h4 className="text-gray-900 dark:text-white font-medium">{reel.title}</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{reel.category}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <span>{reel.view_count.toLocaleString()} vistas</span>
                  <span>{reel.like_count.toLocaleString()} likes</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
