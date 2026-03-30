'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline'

interface User {
  id: string
  first_name: string
  last_name: string
  display_name?: string
  email: string
  avatar_url?: string
}

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onInvite: (userId: string, role: string) => Promise<void>
  communityId: string
  communityName: string
}

export function InviteUserModal({ 
  isOpen, 
  onClose, 
  onInvite, 
  communityId, 
  communityName 
}: InviteUserModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState('member')
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadUsers()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchTerm.trim()) {
      setIsSearching(true)
      const filtered = users.filter(user => 
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
      setIsSearching(false)
    } else {
      setFilteredUsers([])
    }
  }, [searchTerm, users])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      
      
      if (data.success) {
        setUsers(data.users || [])
      } else {
        setError(data.error || 'Error al cargar usuarios')
      }
    } catch (err) {
      setError('Error de conexión al cargar usuarios')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim()
    setSearchTerm(displayName || user.email)
    setFilteredUsers([])
  }

  const handleInvite = async () => {
    if (!selectedUser) return
    
    try {
      setIsLoading(true)
      await onInvite(selectedUser.id, selectedRole)
      onClose()
      setSelectedUser(null)
      setSearchTerm('')
    } catch (err) {
      setError('Error al invitar usuario')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedUser(null)
    setSearchTerm('')
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-600">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl p-6">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white">Invitar Usuario</h2>
              <p className="text-blue-100 mt-1">Agregar usuario a "{communityName}"</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Búsqueda de usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Buscar Usuario
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o email..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Usuario seleccionado */}
            {selectedUser && (
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    {selectedUser.avatar_url ? (
                      <img 
                        src={selectedUser.avatar_url} 
                        alt={selectedUser.display_name || `${selectedUser.first_name} ${selectedUser.last_name}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {selectedUser.display_name || `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || selectedUser.email}
                    </p>
                    <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Lista de usuarios filtrados */}
            {searchTerm && !selectedUser && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {isSearching ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Buscando usuarios...</p>
                  </div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt={user.display_name || `${user.first_name} ${user.last_name}`}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <UserIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}
                          </p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-400">No se encontraron usuarios</p>
                  </div>
                )}
              </div>
            )}

            {/* Selección de rol */}
            {selectedUser && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rol en la Comunidad
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="member">Miembro</option>
                  <option value="moderator">Moderador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleInvite}
                disabled={!selectedUser || isLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Invitar...' : 'Invitar Usuario'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
