'use client'

import { useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { XMarkIcon, TagIcon, ClockIcon, StarIcon } from '@heroicons/react/24/outline'
import { AdminPrompt, AdminCategory } from '../services/adminPrompts.service'

interface EditPromptModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (promptId: string, promptData: Partial<AdminPrompt>) => Promise<void>
  prompt: AdminPrompt | null
}

export function EditPromptModal({ isOpen, onClose, onSave, prompt }: EditPromptModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    tags: '',
    difficulty_level: 'beginner',
    is_featured: false,
    is_verified: false,
    is_active: true,
    category_id: ''
  })
  
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cargar categorías y datos del prompt al abrir el modal
  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      if (prompt) {
        loadPromptData(prompt)
      }
    }
  }, [isOpen, prompt])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.categories || [])
      }
    } catch (error) {
    }
  }

  const loadPromptData = (promptData: AdminPrompt) => {
    setFormData({
      title: promptData.title || '',
      description: promptData.description || '',
      content: promptData.content || '',
      tags: promptData.tags || '',
      difficulty_level: promptData.difficulty_level || 'beginner',
      is_featured: promptData.is_featured || false,
      is_verified: promptData.is_verified || false,
      is_active: promptData.is_active || true,
      category_id: promptData.category_id || ''
    })
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida'
    }

    if (!formData.content.trim()) {
      newErrors.content = 'El contenido del prompt es requerido'
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Debe seleccionar una categoría'
    }


    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!prompt || !validateForm()) {
      return
    }

    try {
      setIsLoading(true)
      
      // Procesar tags (convertir string a array si es necesario)
      const processedTags = formData.tags && typeof formData.tags === 'string' && formData.tags.trim() 
        ? formData.tags
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .join(',')
        : ''

      const promptData = {
        ...formData,
        tags: processedTags,
        slug: formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }

      await onSave(prompt.prompt_id, promptData)
      
      onClose()
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setErrors({})
      onClose()
    }
  }

  if (!prompt) {
    return null
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 dark:text-white">
                      Editar Prompt
                    </Dialog.Title>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Modifica la información del prompt "{prompt.title}"
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información Básica */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Título *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Ej: Generador de Contenido para Redes Sociales"
                        disabled={isLoading}
                      />
                      {errors.title && (
                        <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.title}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Categoría *
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => handleInputChange('category_id', e.target.value)}
                        className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.category_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        disabled={isLoading}
                      >
                        <option value="">Seleccionar categoría</option>
                        {categories.map((category) => (
                          <option key={category.category_id} value={category.category_id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {errors.category_id && (
                        <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.category_id}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descripción *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Breve descripción del prompt y su propósito"
                      disabled={isLoading}
                    />
                    {errors.description && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.description}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contenido del Prompt *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      rows={8}
                      className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                        errors.content ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Escribe aquí el contenido completo del prompt..."
                      disabled={isLoading}
                    />
                    {errors.content && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.content}</p>
                    )}
                  </div>

                  {/* Configuración Avanzada */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <TagIcon className="h-4 w-4 inline mr-1" />
                        Tags
                      </label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => handleInputChange('tags', e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="marketing, redes sociales, contenido"
                        disabled={isLoading}
                      />
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                        Separa los tags con comas
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nivel de Dificultad
                      </label>
                      <select
                        value={formData.difficulty_level}
                        onChange={(e) => handleInputChange('difficulty_level', e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                      >
                        <option value="beginner">Principiante</option>
                        <option value="intermediate">Intermedio</option>
                        <option value="advanced">Avanzado</option>
                      </select>
                    </div>
                  </div>

                  {/* Opciones */}
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                        disabled={isLoading}
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        <StarIcon className="h-4 w-4 inline mr-1" />
                        Destacado
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_verified}
                        onChange={(e) => handleInputChange('is_verified', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                        disabled={isLoading}
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Verificado
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => handleInputChange('is_active', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                        disabled={isLoading}
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Activo
                      </span>
                    </label>
                  </div>

                  {/* Estadísticas del Prompt */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Estadísticas Actuales</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Vistas:</span>
                        <span className="text-gray-900 dark:text-white ml-2">{prompt.view_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Likes:</span>
                        <span className="text-gray-900 dark:text-white ml-2">{prompt.like_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Descargas:</span>
                        <span className="text-gray-900 dark:text-white ml-2">{prompt.download_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Calificación:</span>
                        <span className="text-gray-900 dark:text-white ml-2">{prompt.rating.toFixed(1)} ({prompt.rating_count})</span>
                      </div>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="px-6 py-3 text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Guardando...
                        </>
                      ) : (
                        'Actualizar Prompt'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
