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
  CheckCircleIcon,
  XCircleIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline'
import { useAdminApps } from '../hooks/useAdminApps'
import { AdminApp } from '../services/adminApps.service'

const AddAppModal = dynamic(() => import('./AddAppModal').then(mod => ({ default: mod.AddAppModal })), {
  ssr: false
})
const EditAppModal = dynamic(() => import('./EditAppModal').then(mod => ({ default: mod.EditAppModal })), {
  ssr: false
})
const DeleteAppModal = dynamic(() => import('./DeleteAppModal').then(mod => ({ default: mod.DeleteAppModal })), {
  ssr: false
})
const ViewAppModal = dynamic(() => import('./ViewAppModal').then(mod => ({ default: mod.ViewAppModal })), {
  ssr: false
})

export function AdminAppsPage() {
  const { 
    apps, 
    stats, 
    isLoading, 
    error, 
    refetch, 
    createApp,
    updateApp,
    deleteApp, 
    toggleAppStatus, 
    toggleAppFeatured,
    toggleAppVerified
  } = useAdminApps()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  // Estados para modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState<AdminApp | null>(null)

  // Filtrar apps
  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (app.tags && app.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    
    const matchesCategory = selectedCategory === 'all' || app.category_id === selectedCategory
    
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && app.is_active) ||
                         (selectedStatus === 'inactive' && !app.is_active) ||
                         (selectedStatus === 'featured' && app.is_featured) ||
                         (selectedStatus === 'verified' && app.is_verified)
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleDeleteApp = async (app: AdminApp) => {
    try {
      setIsProcessing(app.app_id)
      await deleteApp(app.app_id)
      setIsDeleteModalOpen(false)
      setSelectedApp(null)
    } catch (error) {
    } finally {
      setIsProcessing(null)
    }
  }

  const handleSaveNewApp = async (appData: Partial<AdminApp>) => {
    try {
      await createApp(appData)
    } catch (error) {
      throw error
    }
  }

  const handleSaveEditApp = async (appId: string, appData: Partial<AdminApp>) => {
    try {
      await updateApp(appId, appData)
    } catch (error) {
      throw error
    }
  }

  const handleToggleStatus = async (app: AdminApp) => {
    try {
      setIsProcessing(app.app_id)
      await toggleAppStatus(app.app_id, !app.is_active)
    } catch (error) {
    } finally {
      setIsProcessing(null)
    }
  }

  const handleToggleFeatured = async (app: AdminApp) => {
    try {
      setIsProcessing(app.app_id)
      await toggleAppFeatured(app.app_id, !app.is_featured)
    } catch (error) {
    } finally {
      setIsProcessing(null)
    }
  }

  const handleToggleVerified = async (app: AdminApp) => {
    try {
      setIsProcessing(app.app_id)
      await toggleAppVerified(app.app_id, !app.is_verified)
    } catch (error) {
    } finally {
      setIsProcessing(null)
    }
  }

  const getPricingColor = (model: string) => {
    switch (model.toLowerCase()) {
      case 'free': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'freemium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'paid': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'subscription': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getPricingLabel = (model: string) => {
    switch (model.toLowerCase()) {
      case 'free': return 'Gratuito'
      case 'freemium': return 'Freemium'
      case 'paid': return 'De Pago'
      case 'subscription': return 'Suscripción'
      default: return model
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando apps...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Error al cargar apps: {error}</p>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Apps de IA</h1>
              <p className="text-gray-600 dark:text-gray-400">Administra todas las apps del directorio</p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Agregar App
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
                <ComputerDesktopIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Apps</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalApps}</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Destacadas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.featuredApps}</p>
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
                  placeholder="Buscar apps..."
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
                  <option value="active">Activas</option>
                  <option value="inactive">Inactivas</option>
                  <option value="featured">Destacadas</option>
                  <option value="verified">Verificadas</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Apps List */}
        <div className="space-y-6">
          {filteredApps.length === 0 ? (
            <div className="text-center py-12">
              <ComputerDesktopIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No se encontraron apps</p>
            </div>
          ) : (
            filteredApps.map((app) => (
              <div key={app.app_id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                          app.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>
                          {app.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                        
                        {app.is_featured && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                            Destacada
                          </span>
                        )}
                        
                        {app.is_verified && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                            Verificada
                          </span>
                        )}
                        
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPricingColor(app.pricing_model)}`}>
                          {getPricingLabel(app.pricing_model)}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{app.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{app.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {app.features && app.features.length > 0 ? (
                          app.features.slice(0, 3).map((feature, index) => (
                            <span
                              key={index}
                              className="inline-flex px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
                            >
                              {feature}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 dark:text-gray-500 text-sm">Sin características</span>
                        )}
                        {app.features && app.features.length > 3 && (
                          <span className="inline-flex px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full">
                            +{app.features.length - 3}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-500 mb-4">
                        <span className="flex items-center mr-4">
                          <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full mr-2"></span>
                          {app.ai_categories?.name || 'Sin categoría'}
                        </span>
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full mr-2"></span>
                          {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Plataformas */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {app.api_available && (
                          <div className="flex items-center gap-1">
                            <CodeBracketIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span>API</span>
                          </div>
                        )}
                        {app.mobile_app && (
                          <div className="flex items-center gap-1">
                            <DevicePhoneMobileIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span>Móvil</span>
                          </div>
                        )}
                        {app.desktop_app && (
                          <div className="flex items-center gap-1">
                            <ComputerDesktopIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span>Desktop</span>
                          </div>
                        )}
                        {app.browser_extension && (
                          <div className="flex items-center gap-1">
                            <GlobeAltIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span>Extensión</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <HeartIcon className="h-4 w-4 mr-1" />
                          {app.like_count}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          {app.view_count}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleStatus(app)}
                        disabled={isProcessing === app.app_id}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          app.is_active 
                            ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/20' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20'
                        }`}
                        title={app.is_active ? "Desactivar app" : "Activar app"}
                      >
                        {isProcessing === app.app_id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 dark:border-green-400"></div>
                        ) : (
                          <EyeSlashIcon className="h-4 w-4" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleToggleFeatured(app)}
                        disabled={isProcessing === app.app_id}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          app.is_featured 
                            ? 'text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/20' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20'
                        }`}
                        title={app.is_featured ? "Quitar destacado" : "Destacar app"}
                      >
                        {isProcessing === app.app_id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 dark:border-orange-400"></div>
                        ) : (
                          <StarIcon className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleToggleVerified(app)}
                        disabled={isProcessing === app.app_id}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          app.is_verified 
                            ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/20' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                        }`}
                        title={app.is_verified ? "Quitar verificación" : "Verificar app"}
                      >
                        {isProcessing === app.app_id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
                        ) : (
                          <CheckCircleIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedApp(app)
                          setIsViewModalOpen(true)
                        }}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Ver app"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedApp(app)
                          setIsEditModalOpen(true)
                        }}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Editar app"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedApp(app)
                          setIsDeleteModalOpen(true)
                        }}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar app"
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
      <AddAppModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewApp}
      />

      <EditAppModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedApp(null)
        }}
        onSave={handleSaveEditApp}
        app={selectedApp}
      />

      <DeleteAppModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedApp(null)
        }}
        onConfirm={handleDeleteApp}
        app={selectedApp}
        isDeleting={isProcessing === selectedApp?.app_id}
      />

      <ViewAppModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedApp(null)
        }}
        app={selectedApp}
      />
    </div>
  )
}
