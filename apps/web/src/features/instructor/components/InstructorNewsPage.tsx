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
import { useInstructorNews } from '../hooks/useInstructorNews'
import { InstructorNews } from '../services/instructorNews.service'

// Lazy loading de modales pesados - Solo se cargan cuando el usuario los abre
// Impacto: ~150-200 KB de reducción en bundle inicial
const AddNewsModal = dynamic(() => import('../../admin/components/AddNewsModal').then(mod => ({ default: mod.AddNewsModal })), {
  ssr: false
})

const EditNewsModal = dynamic(() => import('../../admin/components/EditNewsModal').then(mod => ({ default: mod.EditNewsModal })), {
  ssr: false
})

const DeleteNewsModal = dynamic(() => import('../../admin/components/DeleteNewsModal').then(mod => ({ default: mod.DeleteNewsModal })), {
  ssr: false
})

const ViewNewsModal = dynamic(() => import('../../admin/components/ViewNewsModal').then(mod => ({ default: mod.ViewNewsModal })), {
  ssr: false
})

export function InstructorNewsPage() {
  const { news, stats, isLoading, error, createNews, updateNews, deleteNews, toggleNewsStatus } = useInstructorNews()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')
  const [selectedNews, setSelectedNews] = useState<InstructorNews | null>(null)
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

  const handleSaveNewNews = async (newsData: Partial<InstructorNews>) => {
    try {
      await createNews(newsData)
      setShowAddModal(false)
    } catch (error) {
    }
  }

  const handleSaveEditNews = async (newsData: Partial<InstructorNews>) => {
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

  const handleToggleStatus = async (newsItem: InstructorNews, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      await toggleNewsStatus(newsItem.id, newStatus)
    } catch (error) {
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircleIcon className="h-4 w-4 text-green-400" />
      case 'draft':
        return <ClockIcon className="h-4 w-4 text-yellow-400" />
      case 'archived':
        return <ArchiveBoxIcon className="h-4 w-4 text-gray-400" />
      default:
        return <DocumentTextIcon className="h-4 w-4 text-gray-400" />
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
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="h-9 bg-gray-700 rounded-xl w-64 mb-2 animate-pulse"></div>
            <div className="h-5 bg-gray-700 rounded w-96 animate-pulse"></div>
          </div>
          <div className="h-12 bg-gray-700 rounded-xl w-40 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl shadow-lg border border-gray-700/50 p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-700 rounded w-16"></div>
                </div>
                <div className="h-12 w-12 bg-gray-700 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl shadow-lg border border-gray-700/50 p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-700/50 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestión de Noticias</h1>
            <p className="text-gray-400 text-sm">Administra y gestiona todas tus noticias publicadas</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-xl shadow-lg border border-red-500/30 p-8">
          <div className="text-center">
            <div className="inline-flex p-3 rounded-full bg-red-500/20 mb-4">
              <XCircleIcon className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-red-400 mb-2">Error al cargar noticias</h3>
            <p className="text-gray-400 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl shadow-lg shadow-red-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-red-500/30 font-medium"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header mejorado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestión de Noticias</h1>
          <p className="text-gray-400 text-sm">Administra y gestiona todas tus noticias publicadas</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 font-medium"
        >
          <PlusIcon className="h-5 w-5" />
          Nueva Noticia
        </button>
      </div>

      {/* Estadísticas mejoradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl shadow-lg border border-gray-700/50 p-6 hover:border-blue-500/50 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400 mb-1">Total Noticias</p>
              <p className="text-3xl font-bold text-white mb-2">{stats.totalNews}</p>
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 group-hover:from-blue-500/30 group-hover:to-blue-600/20 transition-all">
              <DocumentTextIcon className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl shadow-lg border border-gray-700/50 p-6 hover:border-green-500/50 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400 mb-1">Publicadas</p>
              <p className="text-3xl font-bold text-white mb-2">{stats.publishedNews}</p>
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 group-hover:from-green-500/30 group-hover:to-green-600/20 transition-all">
              <CheckCircleIcon className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl shadow-lg border border-gray-700/50 p-6 hover:border-yellow-500/50 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400 mb-1">Borradores</p>
              <p className="text-3xl font-bold text-white mb-2">{stats.draftNews}</p>
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 group-hover:from-yellow-500/30 group-hover:to-yellow-600/20 transition-all">
              <ClockIcon className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl shadow-lg border border-gray-700/50 p-6 hover:border-purple-500/50 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400 mb-1">Total Vistas</p>
              <p className="text-3xl font-bold text-white mb-2">{stats.totalViews.toLocaleString()}</p>
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 group-hover:from-purple-500/30 group-hover:to-purple-600/20 transition-all">
              <EyeIcon className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda mejorados */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl shadow-lg border border-gray-700/50 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar noticias por título, descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="pl-10 pr-10 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none backdrop-blur-sm cursor-pointer"
              >
                <option value="all">Todos los estados</option>
                <option value="published">Publicadas</option>
                <option value="draft">Borradores</option>
                <option value="archived">Archivadas</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de noticias mejorada */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl shadow-lg border border-gray-700/50 overflow-hidden">
        <div className="p-6 border-b border-gray-700/50 bg-gray-800/30">
          <h3 className="text-xl font-semibold text-white">
            Mis Noticias <span className="text-gray-400 font-normal">({filteredNews.length})</span>
          </h3>
        </div>
        
        <div className="p-6">
          {filteredNews.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex p-4 rounded-full bg-gray-700/50 mb-4">
                <DocumentTextIcon className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-gray-400 text-lg mb-1">No se encontraron noticias</p>
              <p className="text-gray-500 text-sm">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNews.map((newsItem) => (
                <div
                  key={newsItem.id}
                  className="bg-gradient-to-br from-gray-700/50 to-gray-800/30 rounded-xl p-6 border border-gray-600/30 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 group"
                >
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <h4 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors flex-1">
                          {newsItem.title}
                        </h4>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(newsItem.status)}`}>
                          {getStatusIcon(newsItem.status)}
                          <span className="capitalize">
                            {newsItem.status === 'published' ? 'Publicada' : 
                             newsItem.status === 'draft' ? 'Borrador' : 
                             'Archivada'}
                          </span>
                        </span>
                      </div>
                      
                      {newsItem.intro && (
                        <p className="text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">{newsItem.intro}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="inline-flex items-center gap-1.5 text-gray-400">
                          <span className="px-2 py-0.5 rounded bg-gray-700/50 text-xs uppercase font-medium">{newsItem.language}</span>
                        </span>
                        <span className="text-gray-400">
                          👁️ {newsItem.metrics?.views || 0} vistas
                        </span>
                        <span className="text-gray-400">
                          💬 {newsItem.metrics?.comments || 0} comentarios
                        </span>
                        <span className="text-gray-500">
                          📅 {new Date(newsItem.created_at).toLocaleDateString('es-ES', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 lg:flex-col">
                      <button
                        onClick={() => {
                          setSelectedNews(newsItem)
                          setShowViewModal(true)
                        }}
                        className="p-2.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-500/30"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedNews(newsItem)
                          setShowEditModal(true)
                        }}
                        className="p-2.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-yellow-500/30"
                        title="Editar"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedNews(newsItem)
                          setShowDeleteModal(true)
                        }}
                        className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/30"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-5 w-5" />
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
  )
}

