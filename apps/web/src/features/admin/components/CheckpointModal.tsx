'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, Clock } from 'lucide-react'
import { AdminCheckpoint } from '../services/adminCheckpoints.service'

interface CheckpointModalProps {
  checkpoint?: AdminCheckpoint | null
  lessonId: string
  onClose: () => void
  onSave: (data: any) => Promise<void>
}

export function CheckpointModal({ checkpoint, lessonId, onClose, onSave }: CheckpointModalProps) {
  const [formData, setFormData] = useState({
    checkpoint_time_seconds: 0,
    checkpoint_label: '',
    checkpoint_description: '',
    is_required_completion: false
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (checkpoint) {
      setFormData({
        checkpoint_time_seconds: checkpoint.checkpoint_time_seconds,
        checkpoint_label: checkpoint.checkpoint_label || '',
        checkpoint_description: checkpoint.checkpoint_description || '',
        is_required_completion: checkpoint.is_required_completion
      })
    }
  }, [checkpoint])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSave(formData)
      onClose()
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const parseDuration = (duration: string) => {
    const [mins, secs] = duration.split(':').map(Number)
    return (mins * 60) + (secs || 0)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white">
            {checkpoint ? 'Editar Checkpoint' : 'Crear Checkpoint'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tiempo del Checkpoint */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tiempo del Checkpoint (mm:ss) *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                required
                value={formatDuration(formData.checkpoint_time_seconds)}
                onChange={(e) => setFormData(prev => ({ ...prev, checkpoint_time_seconds: parseDuration(e.target.value) }))}
                placeholder="05:30"
                pattern="\d{1,3}:\d{2}"
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Etiqueta */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Etiqueta
            </label>
            <input
              type="text"
              value={formData.checkpoint_label}
              onChange={(e) => setFormData(prev => ({ ...prev, checkpoint_label: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Punto de Reflexión 1"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              rows={3}
              value={formData.checkpoint_description}
              onChange={(e) => setFormData(prev => ({ ...prev, checkpoint_description: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción del checkpoint..."
            />
          </div>

          {/* Completado Requerido */}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_required_completion}
              onChange={(e) => setFormData(prev => ({ ...prev, is_required_completion: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-300">Completado Requerido</span>
          </label>

          {/* Botones */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-600">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Guardar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

