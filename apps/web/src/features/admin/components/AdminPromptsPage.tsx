'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  HeartIcon,
  EyeSlashIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { useAdminPrompts } from '../hooks/useAdminPrompts'
import { AdminPrompt } from '../services/adminPrompts.service'

// Lazy loading de modales de Prompts
const AddPromptModal = dynamic(() => import('./AddPromptModal').then(mod => ({ default: mod.AddPromptModal })), {
  ssr: false
})

const EditPromptModal = dynamic(() => import('./EditPromptModal').then(mod => ({ default: mod.EditPromptModal })), {
  ssr: false
})

const DeletePromptModal = dynamic(() => import('./DeletePromptModal').then(mod => ({ default: mod.DeletePromptModal })), {
  ssr: false
})

const ViewPromptModal = dynamic(() => import('./ViewPromptModal').then(mod => ({ default: mod.ViewPromptModal })), {
  ssr: false
})

export function AdminPromptsPage() {
  const { 
    prompts, 
    stats, 
    isLoading, 
    error, 
    refetch, 
    createPrompt,
    updatePrompt,
    deletePrompt, 
    togglePromptStatus, 
    togglePromptFeatured 
  } = useAdminPrompts()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  // Estados para modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<AdminPrompt | null>(null)

  // Filtrar prompts
  const filteredPrompts = prompts.filter(prompt => {
    // Manejar tags correctamente (puede ser array, string o null)
    let tagsString = ''
    if (Array.isArray(prompt.tags)) {
      tagsString = prompt.tags.join(' ')
    } else if (typeof prompt.tags === 'string') {
      tagsString = prompt.tags
    }

    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tagsString.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || prompt.category_id === selectedCategory

    const matchesStatus = selectedStatus === 'all' ||
                         (selectedStatus === 'active' && prompt.is_active) ||
                         (selectedStatus === 'inactive' && !prompt.is_active) ||
                         (selectedStatus === 'featured' && prompt.is_featured)

    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleDeletePrompt = async (prompt: AdminPrompt) => {
    try {
      setIsProcessing(prompt.prompt_id)
      await deletePrompt(prompt.prompt_id)
      setIsDeleteModalOpen(false)
      setSelectedPrompt(null)
    } catch (error) {
    } finally {
      setIsProcessing(null)
    }
  }

  const handleSaveNewPrompt = async (promptData: Partial<AdminPrompt>) => {
    try {
      await createPrompt(promptData)
    } catch (error) {
      throw error
    }
  }

  const handleSaveEditPrompt = async (promptId: string, promptData: Partial<AdminPrompt>) => {
    try {
      await updatePrompt(promptId, promptData)
    } catch (error) {
      throw error
    }
  }

  const handleToggleStatus = async (prompt: AdminPrompt) => {
    try {
      setIsProcessing(prompt.prompt_id)
      await togglePromptStatus(prompt.prompt_id, !prompt.is_active)
    } catch (error) {
    } finally {
      setIsProcessing(null)
    }
  }

  const handleToggleFeatured = async (prompt: AdminPrompt) => {
    try {
      setIsProcessing(prompt.prompt_id)
      await togglePromptFeatured(prompt.prompt_id, !prompt.is_featured)
    } catch (error) {
    } finally {
      setIsProcessing(null)
    }
  }

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando prompts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Error al cargar prompts: {error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Prompts</h1>
              <p className="text-gray-600 dark:text-gray-400">Administra todos los prompts del directorio</p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Agregar Prompt
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-600/20 rounded-lg">
                <TagIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Prompts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPrompts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-600/20 rounded-lg">
                <HeartIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Likes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLikes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-600/20 rounded-lg">
                <EyeIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Vistas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalViews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 dark:bg-orange-600/20 rounded-lg">
                <StarIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Destacados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.featuredPrompts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar prompts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-8 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">Todas las categorías</option>
                  {/* TODO: Cargar categorías dinámicamente */}
                </select>
              </div>
              
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="pl-4 pr-8 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                  <option value="featured">Destacados</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Prompts List */}
        <div className="space-y-6">
          {filteredPrompts.length === 0 ? (
            <div className="text-center py-12">
              <TagIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No se encontraron prompts</p>
            </div>
          ) : (
            filteredPrompts.map((prompt) => (
              <div key={prompt.prompt_id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(prompt.is_active)}`}>
                          {prompt.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                        {prompt.is_featured && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                            Destacado
                          </span>
                        )}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getDifficultyColor(prompt.difficulty_level)}`}>
                          {prompt.difficulty_level}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{prompt.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{prompt.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {prompt.tags && Array.isArray(prompt.tags) && prompt.tags.length > 0 ? (
                          prompt.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
                            >
                              {tag}
                            </span>
                          ))
                        ) : prompt.tags && typeof prompt.tags === 'string' && prompt.tags.trim() ? (
                          prompt.tags.split(',').map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
                            >
                              {tag.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 text-sm">Sin tags</span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-500 mb-4">
                        <span className="flex items-center mr-4">
                          <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full mr-2"></span>
                          {prompt.author?.display_name || prompt.author?.first_name || 'Autor desconocido'}
                        </span>
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full mr-2"></span>
                          {new Date(prompt.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <HeartIcon className="h-4 w-4 mr-1" />
                          {prompt.like_count}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          {prompt.view_count}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleStatus(prompt)}
                        disabled={isProcessing === prompt.prompt_id}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          prompt.is_active 
                            ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/20' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20'
                        }`}
                        title={prompt.is_active ? "Desactivar prompt" : "Activar prompt"}
                      >
                        {isProcessing === prompt.prompt_id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 dark:border-green-400"></div>
                        ) : (
                          <EyeSlashIcon className="h-4 w-4" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleToggleFeatured(prompt)}
                        disabled={isProcessing === prompt.prompt_id}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          prompt.is_featured 
                            ? 'text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/20' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20'
                        }`}
                        title={prompt.is_featured ? "Quitar destacado" : "Destacar prompt"}
                      >
                        {isProcessing === prompt.prompt_id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 dark:border-orange-400"></div>
                        ) : (
                          <StarIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPrompt(prompt)
                          setIsViewModalOpen(true)
                        }}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Ver prompt"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedPrompt(prompt)
                          setIsEditModalOpen(true)
                        }}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Editar prompt"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedPrompt(prompt)
                          setIsDeleteModalOpen(true)
                        }}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar prompt"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modales */}
      <AddPromptModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewPrompt}
      />

      <EditPromptModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedPrompt(null)
        }}
        onSave={handleSaveEditPrompt}
        prompt={selectedPrompt}
      />

      <DeletePromptModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedPrompt(null)
        }}
        onConfirm={handleDeletePrompt}
        prompt={selectedPrompt}
        isDeleting={isProcessing === selectedPrompt?.prompt_id}
      />

      <ViewPromptModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedPrompt(null)
        }}
        prompt={selectedPrompt}
      />
    </div>
  )
}