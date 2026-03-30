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
  DocumentTextIcon,
  ClockIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { useAdminNews } from '../hooks/useAdminNews'
import { AdminNews } from '../services/adminNews.service'

// Lazy loading de modales pesados - Solo se cargan cuando el usuario los abre
// Impacto: ~150-200 KB de reducción en bundle inicial
const AddNewsModal = dynamic(() => import('./AddNewsModal').then(mod => ({ default: mod.AddNewsModal })), {
  ssr: false
})

const EditNewsModal = dynamic(() => import('./EditNewsModal').then(mod => ({ default: mod.EditNewsModal })), {
  ssr: false
})

const DeleteNewsModal = dynamic(() => import('./DeleteNewsModal').then(mod => ({ default: mod.DeleteNewsModal })), {
  ssr: false
})

const ViewNewsModal = dynamic(() => import('./ViewNewsModal').then(mod => ({ default: mod.ViewNewsModal })), {
  ssr: false
})

export function AdminNewsPage() {
  const { news, stats, isLoading, error, createNews, updateNews, deleteNews, toggleNewsStatus } = useAdminNews()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')
  const [selectedNews, setSelectedNews] = useState<AdminNews | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)

  // Filtrar noticias
  const filteredNews = news.filter(newsItem => {
    const matchesSearch = newsItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         newsItem.intro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         newsItem.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || newsItem.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleSaveNewNews = async (newsData: Partial<AdminNews>) => {
    try {
      await createNews(newsData)
      setShowAddModal(false)
    } catch (error) {
    }
  }

  const handleSaveEditNews = async (newsData: Partial<AdminNews>) => {
    if (!selectedNews) return
    
    try {
      await updateNews(selectedNews.id, newsData)
      setShowEditModal(false)
      setSelectedNews(null)
    } catch (error) {
    }
  }

  const handleDeleteNews = async () => {
    if (!selectedNews) return
    
    try {
      await deleteNews(selectedNews.id)
      setShowDeleteModal(false)
      setSelectedNews(null)
    } catch (error) {
    }
  }

  const handleToggleStatus = async (newsItem: AdminNews, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      await toggleNewsStatus(newsItem.id, newStatus)
    } catch (error) {
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'draft':
        return <ClockIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      case 'archived':
        return <ArchiveBoxIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      default:
        return <DocumentTextIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Noticias</h1>
          </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Noticias</h1>
          </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-2">Error al cargar noticias</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Noticias</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Nueva Noticia
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Noticias</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalNews}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Publicadas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.publishedNews}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
              <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Borradores</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.draftNews}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <EyeIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Vistas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Buscar noticias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="published">Publicadas</option>
              <option value="draft">Borradores</option>
              <option value="archived">Archivadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de noticias */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Noticias ({filteredNews.length})
          </h3>
          
          {filteredNews.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No se encontraron noticias</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNews.map((newsItem) => (
                <div
                  key={newsItem.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{newsItem.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(newsItem.status)}`}>
                          {getStatusIcon(newsItem.status)}
                          <span className="capitalize">{newsItem.status}</span>
                        </span>
                      </div>
                      
                      {newsItem.intro && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">{newsItem.intro}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{newsItem.language}</span>
                        <span>{newsItem.metrics?.views || 0} vistas</span>
                        <span>{newsItem.metrics?.comments || 0} comentarios</span>
                        <span>{new Date(newsItem.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedNews(newsItem)
                          setShowViewModal(true)
                        }}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedNews(newsItem)
                          setShowEditModal(true)
                        }}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedNews(newsItem)
                          setShowDeleteModal(true)
                        }}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {showAddModal && (
        <AddNewsModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveNewNews}
        />
      )}

      {showEditModal && selectedNews && (
        <EditNewsModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedNews(null)
          }}
          news={selectedNews}
          onSave={handleSaveEditNews}
        />
      )}

      {showDeleteModal && selectedNews && (
        <DeleteNewsModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedNews(null)
          }}
          news={selectedNews}
          onConfirm={handleDeleteNews}
        />
      )}

      {showViewModal && selectedNews && (
        <ViewNewsModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false)
            setSelectedNews(null)
          }}
          news={selectedNews}
        />
      )}
      </div>
    </div>
  )
}
