'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UsersIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'
import { useAdminUsers } from '../hooks/useAdminUsers'
import type { NewAdminUserData } from './AddUserModal'
import { AdminUser } from '../services/adminUsers.service'

const EditUserModal = dynamic(() => import('./EditUserModal').then(mod => ({ default: mod.EditUserModal })), {
  ssr: false
})
const DeleteUserModal = dynamic(() => import('./DeleteUserModal').then(mod => ({ default: mod.DeleteUserModal })), {
  ssr: false
})
const AddUserModal = dynamic(() => import('./AddUserModal').then(mod => ({ default: mod.AddUserModal })), {
  ssr: false
})

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

export function AdminUsersPage() {
  const { users, stats, isLoading, error, refetch } = useAdminUsers()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const filteredUsers = users.filter(user => {
    const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    const matchesSearch = displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.cargo_rol === filterRole
    
    return matchesSearch && matchesRole
  })

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Administrador':
        return {
          bg: 'bg-[#0A2540]/10 dark:bg-[#0A2540]/30',
          text: 'text-[#0A2540] dark:text-[#00D4B3]',
          border: 'border-[#0A2540]/20 dark:border-[#00D4B3]/30',
          icon: ShieldCheckIcon
        }
      case 'Instructor':
        return {
          bg: 'bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20',
          text: 'text-[#F59E0B]',
          border: 'border-[#F59E0B]/20',
          icon: AcademicCapIcon
        }
      case 'Usuario':
        return {
          bg: 'bg-[#10B981]/10 dark:bg-[#10B981]/20',
          text: 'text-[#10B981]',
          border: 'border-[#10B981]/20',
          icon: UserCircleIcon
        }
      default:
        return {
          bg: 'bg-[#6C757D]/10 dark:bg-[#6C757D]/20',
          text: 'text-[#6C757D]',
          border: 'border-[#6C757D]/20',
          icon: UserCircleIcon
        }
    }
  }

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  const handleDeleteUser = (user: AdminUser) => {
    setDeletingUser(user)
    setIsDeleteModalOpen(true)
  }

  const handleSaveUser = async (userData: Partial<AdminUser>) => {
    if (!editingUser) return

    const response = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      if (errorData?.message === 'Datos inválidos' && errorData?.errors) {
        throw new Error(errorData.errors.map((e: any) => `${e.field}: ${e.message}`).join(', '))
      }
      throw new Error(errorData?.error || errorData?.message || 'Error al actualizar usuario')
    }

    refetch()
  }

  const handleConfirmDelete = async () => {
    if (!deletingUser) return

    try {
      const response = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al eliminar usuario')
      }

      await refetch()
      setIsDeleteModalOpen(false)
      setDeletingUser(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar usuario')
    }
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingUser(null)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setDeletingUser(null)
  }

  const handleAddUser = () => {
    setIsAddModalOpen(true)
  }

  const handleSaveNewUser = async (userData: NewAdminUserData) => {
    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (errorData?.message === 'Datos inválidos' && errorData?.errors) {
          throw new Error(errorData.errors.map((e: any) => `${e.field}: ${e.message}`).join(', '))
        }
        throw new Error(errorData?.error || errorData?.message || 'Error al crear usuario')
      }

      refetch()
      setIsAddModalOpen(false)
    } catch (error) {
      throw error
    }
  }

  const closeAddModal = () => {
    setIsAddModalOpen(false)
  }

  if (isLoading) {
    return (
      <div className="p-6 min-h-screen bg-white dark:bg-[#0F1419]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-full border-t-[#00D4B3] animate-spin"></div>
              <p className="text-[#6C757D] dark:text-white/70">Cargando usuarios...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen bg-white dark:bg-[#0F1419]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#1E2329] border border-red-500/20 dark:border-red-500/30 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XMarkIcon className="h-5 w-5 text-red-500" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#0A2540] dark:text-white mb-2">
                  Error al cargar usuarios
                </h3>
                <p className="text-sm text-[#6C757D] dark:text-white/70 mb-4">
                  {error}
                </p>
                <motion.button
                  onClick={refetch}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-[#0A2540] hover:bg-[#0d2f4d] text-white rounded-xl text-sm font-medium transition-colors duration-200"
                >
                  Reintentar
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-white dark:bg-[#0F1419]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header Compacto */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0A2540] dark:text-white mb-1">
                  Gestión de Usuarios
                </h1>
                <p className="text-sm text-[#6C757D] dark:text-white/70">
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'usuario' : 'usuarios'} encontrados
                </p>
              </div>
              <motion.button
                onClick={handleAddUser}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#0A2540] hover:bg-[#0d2f4d] text-white rounded-xl text-sm font-medium shadow-lg shadow-[#0A2540]/20 transition-all duration-200"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Agregar Usuario</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Stats Cards Compactas */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              className="bg-gradient-to-br from-[#0A2540] to-[#0A2540]/80 dark:from-[#1E2329] dark:to-[#0A2540]/30 rounded-xl p-4 border border-[#0A2540]/10 dark:border-[#6C757D]/30 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/70 dark:text-white/60 mb-1">Total</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-white/10 dark:bg-[#00D4B3]/10 flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              className="bg-gradient-to-br from-[#10B981] to-[#10B981]/80 dark:from-[#1E2329] dark:to-[#10B981]/20 rounded-xl p-4 border border-[#10B981]/10 dark:border-[#6C757D]/30 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/70 dark:text-white/60 mb-1">Verificados</p>
                  <p className="text-2xl font-bold text-white">{stats?.verifiedUsers || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-white/10 dark:bg-[#10B981]/10 flex items-center justify-center">
                  <CheckCircleIconSolid className="h-5 w-5 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              className="bg-gradient-to-br from-[#F59E0B] to-[#F59E0B]/80 dark:from-[#1E2329] dark:to-[#F59E0B]/20 rounded-xl p-4 border border-[#F59E0B]/10 dark:border-[#6C757D]/30 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/70 dark:text-white/60 mb-1">Instructores</p>
                  <p className="text-2xl font-bold text-white">{stats?.instructors || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-white/10 dark:bg-[#F59E0B]/10 flex items-center justify-center">
                  <AcademicCapIcon className="h-5 w-5 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              className="bg-gradient-to-br from-[#00D4B3] to-[#00D4B3]/80 dark:from-[#1E2329] dark:to-[#00D4B3]/20 rounded-xl p-4 border border-[#00D4B3]/10 dark:border-[#6C757D]/30 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/70 dark:text-white/60 mb-1">Administradores</p>
                  <p className="text-2xl font-bold text-white">{stats?.administrators || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-white/10 dark:bg-[#00D4B3]/10 flex items-center justify-center">
                  <ShieldCheckIcon className="h-5 w-5 text-white" />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Search and Filter Bar */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6C757D] dark:text-white/60" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, email o username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent bg-white dark:bg-[#0A0D12] text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 transition-all duration-200"
                  />
                </div>
                <div className="relative">
                  <motion.button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-4 py-2.5 border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl bg-white dark:bg-[#0A0D12] text-[#0A2540] dark:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329] transition-colors duration-200"
                  >
                    <FunnelIcon className="h-5 w-5 text-[#6C757D] dark:text-white/60" />
                    <span className="text-sm font-medium">
                      {filterRole === 'all' ? 'Todos los roles' : filterRole}
                    </span>
                  </motion.button>
                  
                  <AnimatePresence>
                    {isFilterOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl shadow-xl z-50 overflow-hidden"
                      >
                        {['all', 'Usuario', 'Instructor', 'Administrador'].map((role) => (
                          <button
                            key={role}
                            onClick={() => {
                              setFilterRole(role)
                              setIsFilterOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-200 ${
                              filterRole === role
                                ? 'bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 text-[#00D4B3] font-medium'
                                : 'text-[#0A2540] dark:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/30'
                            }`}
                          >
                            {role === 'all' ? 'Todos los roles' : role}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Users Grid/List */}
          <motion.div variants={itemVariants}>
            {filteredUsers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-12 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#E9ECEF] dark:bg-[#0A0D12] flex items-center justify-center">
                  <UsersIcon className="h-8 w-8 text-[#6C757D] dark:text-white/60" />
                </div>
                <h3 className="text-lg font-semibold text-[#0A2540] dark:text-white mb-2">
                  No se encontraron usuarios
                </h3>
                <p className="text-sm text-[#6C757D] dark:text-white/70">
                  {searchTerm || filterRole !== 'all'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'No hay usuarios registrados en el sistema'}
                </p>
              </motion.div>
            ) : (
              <div className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#E9ECEF] dark:divide-[#6C757D]/30">
                    <thead className="bg-[#E9ECEF]/50 dark:bg-[#0A0D12]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6C757D] dark:text-white/70 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6C757D] dark:text-white/70 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6C757D] dark:text-white/70 uppercase tracking-wider">
                          Rol
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6C757D] dark:text-white/70 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6C757D] dark:text-white/70 uppercase tracking-wider">
                          Último acceso
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-[#6C757D] dark:text-white/70 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-[#1E2329] divide-y divide-[#E9ECEF] dark:divide-[#6C757D]/30">
                      <AnimatePresence>
                        {filteredUsers.map((user, index) => {
                          const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
                          const roleBadge = getRoleBadge(user.cargo_rol)
                          const RoleIcon = roleBadge.icon
                          
                          return (
                            <motion.tr
                              key={user.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ delay: index * 0.02, duration: 0.3 }}
                              className="hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A0D12] transition-colors duration-200 group"
                            >
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    {user.profile_picture_url ? (
                                      <motion.img
                                        src={user.profile_picture_url}
                                        alt={displayName}
                                        className="h-10 w-10 rounded-full object-cover border-2 border-[#E9ECEF] dark:border-[#6C757D]/30"
                                        whileHover={{ scale: 1.1 }}
                                      />
                                    ) : (
                                      <motion.div
                                        className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center text-white text-sm font-semibold border-2 border-[#E9ECEF] dark:border-[#6C757D]/30"
                                        whileHover={{ scale: 1.1 }}
                                      >
                                        {displayName.charAt(0).toUpperCase()}
                                      </motion.div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-[#0A2540] dark:text-white">
                                      {displayName}
                                    </div>
                                    <div className="text-xs text-[#6C757D] dark:text-white/60">
                                      @{user.username}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-[#0A2540] dark:text-white">{user.email}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <motion.span
                                  whileHover={{ scale: 1.05 }}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}
                                >
                                  <RoleIcon className="h-3.5 w-3.5" />
                                  {user.cargo_rol}
                                </motion.span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <motion.span
                                  whileHover={{ scale: 1.05 }}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg ${
                                    user.email_verified
                                      ? 'bg-[#10B981]/10 dark:bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/20'
                                      : 'bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/20'
                                  }`}
                                >
                                  {user.email_verified ? (
                                    <CheckCircleIcon className="h-3.5 w-3.5" />
                                  ) : (
                                    <ClockIcon className="h-3.5 w-3.5" />
                                  )}
                                  {user.email_verified ? 'Verificado' : 'Pendiente'}
                                </motion.span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-[#6C757D] dark:text-white/60">
                                  {user.updated_at 
                                    ? new Date(user.updated_at).toLocaleDateString('es-ES', { 
                                        day: 'numeric', 
                                        month: 'short',
                                        year: 'numeric'
                                      })
                                    : 'Nunca'}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <motion.button
                                    onClick={() => handleEditUser(user)}
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-2 rounded-lg text-[#00D4B3] hover:bg-[#00D4B3]/10 dark:hover:bg-[#00D4B3]/20 transition-colors duration-200"
                                    title="Editar usuario"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </motion.button>
                                  <motion.button
                                    onClick={() => handleDeleteUser(user)}
                                    whileHover={{ scale: 1.1, rotate: -5 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors duration-200"
                                    title="Eliminar usuario"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </motion.button>
                                </div>
                              </td>
                            </motion.tr>
                          )
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Modals */}
      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={handleSaveUser}
      />

      <DeleteUserModal
        user={deletingUser}
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
      />

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSave={handleSaveNewUser}
      />
    </div>
  )
}
