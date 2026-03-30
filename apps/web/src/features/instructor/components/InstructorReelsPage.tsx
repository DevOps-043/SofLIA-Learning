'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useInstructorReels } from '../hooks/useInstructorReels'
import { InstructorReel } from '../services/instructorReels.service'

// Lazy loading de modales de Reels
const AddReelModal = dynamic(() => import('../../admin/components/AddReelModal').then(mod => ({ default: mod.AddReelModal })), {
  ssr: false
})

const EditReelModal = dynamic(() => import('../../admin/components/EditReelModal').then(mod => ({ default: mod.EditReelModal })), {
  ssr: false
})

const DeleteReelModal = dynamic(() => import('../../admin/components/DeleteReelModal').then(mod => ({ default: mod.DeleteReelModal })), {
  ssr: false
})

const ViewReelModal = dynamic(() => import('../../admin/components/ViewReelModal').then(mod => ({ default: mod.ViewReelModal })), {
  ssr: false
})

import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Heart, 
  Share2, 
  MessageCircle, 
  Star, 
  Play, 
  Pause,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  Clock,
  Globe
} from 'lucide-react'

export function InstructorReelsPage() {
  const { 
    reels, 
    stats, 
    loading, 
    error, 
    createReel, 
    updateReel, 
    deleteReel, 
    toggleReelStatus, 
    toggleReelFeatured 
  } = useInstructorReels()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedReel, setSelectedReel] = useState<InstructorReel | null>(null)

  const filteredReels = reels.filter(reel => {
    const matchesSearch = reel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reel.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reel.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && reel.is_active) ||
                         (statusFilter === 'inactive' && !reel.is_active)
    
    const matchesCategory = categoryFilter === 'all' || reel.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const categories = Array.from(new Set(reels.map(reel => reel.category)))

  const handleAddReel = async (data: any) => {
    try {
      await createReel(data)
      setShowAddModal(false)
    } catch (error) {
    }
  }

  const handleEditReel = async (data: any) => {
    if (!selectedReel) return
    try {
      await updateReel(selectedReel.id, data)
      setShowEditModal(false)
      setSelectedReel(null)
    } catch (error) {
    }
  }

  const handleDeleteReel = async () => {
    if (!selectedReel) return
    try {
      await deleteReel(selectedReel.id)
      setShowDeleteModal(false)
      setSelectedReel(null)
    } catch (error) {
    }
  }

  const handleToggleStatus = async (reel: InstructorReel) => {
    try {
      await toggleReelStatus(reel.id)
    } catch (error) {
    }
  }

  const handleToggleFeatured = async (reel: InstructorReel) => {
    try {
      await toggleReelFeatured(reel.id)
    } catch (error) {
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-red-400">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Administrar Reels</h1>
          <p className="text-gray-400">Gestiona todos los reels de la plataforma</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar Reel
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Reels</p>
                <p className="text-2xl font-bold text-white">{stats.totalReels}</p>
              </div>
              <Play className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Activos</p>
                <p className="text-2xl font-bold text-white">{stats.activeReels}</p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Vistas</p>
                <p className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString()}</p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Likes</p>
                <p className="text-2xl font-bold text-white">{stats.totalLikes.toLocaleString()}</p>
              </div>
              <Heart className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6 border border-gray-600">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar reels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas las categorías</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reels Table */}
      <div className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Reel
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Duración
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Estadísticas
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {filteredReels.map((reel) => (
                <tr key={reel.id} className="hover:bg-gray-600/50">
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={reel.thumbnail_url}
                          alt={reel.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                          <Play className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">
                          {reel.title}
                        </p>
                        <p className="text-sm text-gray-400 truncate">
                          {reel.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {reel.category}
                    </span>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex items-center text-sm text-gray-300">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDuration(reel.duration_seconds)}
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex space-x-4 text-sm text-gray-300">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {reel.view_count.toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-1" />
                        {reel.like_count.toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        <Share2 className="w-4 h-4 mr-1" />
                        {reel.share_count.toLocaleString()}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        reel.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {reel.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      {reel.is_featured && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Destacado
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-300">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(reel.created_at)}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedReel(reel)
                          setShowViewModal(true)
                        }}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedReel(reel)
                          setShowEditModal(true)
                        }}
                        className="text-yellow-400 hover:text-yellow-300 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleToggleStatus(reel)}
                        className={`transition-colors ${
                          reel.is_active 
                            ? 'text-red-400 hover:text-red-300' 
                            : 'text-green-400 hover:text-green-300'
                        }`}
                        title={reel.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {reel.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => handleToggleFeatured(reel)}
                        className={`transition-colors ${
                          reel.is_featured 
                            ? 'text-yellow-400 hover:text-yellow-300' 
                            : 'text-gray-400 hover:text-gray-300'
                        }`}
                        title={reel.is_featured ? 'Quitar destacado' : 'Destacar'}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedReel(reel)
                          setShowDeleteModal(true)
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddReelModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddReel}
        />
      )}

      {showEditModal && selectedReel && (
        <EditReelModal
          reel={selectedReel}
          onClose={() => {
            setShowEditModal(false)
            setSelectedReel(null)
          }}
          onSave={handleEditReel}
        />
      )}

      {showDeleteModal && selectedReel && (
        <DeleteReelModal
          reel={selectedReel}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedReel(null)
          }}
          onConfirm={handleDeleteReel}
        />
      )}

      {showViewModal && selectedReel && (
        <ViewReelModal
          reel={selectedReel}
          onClose={() => {
            setShowViewModal(false)
            setSelectedReel(null)
          }}
        />
      )}
    </div>
  )
}

