import { useState, useEffect } from 'react'
import { BusinessUsersService, BusinessUser, BusinessUserStats } from '../services/businessUsers.service'

export function useBusinessUsers() {
  const [users, setUsers] = useState<BusinessUser[]>([])
  const [stats, setStats] = useState<BusinessUserStats>({
    total: 0,
    active: 0,
    invited: 0,
    suspended: 0,
    admins: 0,
    members: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const [usersData, statsData] = await Promise.all([
        BusinessUsersService.getOrganizationUsers(),
        BusinessUsersService.getOrganizationStats()
      ])
      
      setUsers(usersData)
      setStats(statsData)
      
      // Si no hay datos, mostrar mensaje informativo pero no error
      if (usersData.length === 0) {
        // console.info('No users found in organization')
      }
    } catch (err) {
      // Solo setear error en casos críticos, no bloquear UI
      // console.error('Error loading users:', err)
      setUsers([])
      setStats({
        total: 0,
        active: 0,
        invited: 0,
        suspended: 0,
        admins: 0,
        members: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const createUser = async (userData: {
    username: string
    email: string
    password?: string
    first_name?: string
    last_name?: string
    display_name?: string
    job_title: string
    org_role?: 'owner' | 'admin' | 'member'
    send_invitation?: boolean
  }) => {
    try {
      const newUser = await BusinessUsersService.createUser(userData as any)

      // Actualización optimista: agregar usuario y actualizar stats localmente
      setUsers(prev => [...prev, newUser])
      setStats(prev => {
        const statusKey = newUser.org_status && newUser.org_status !== 'removed' ? newUser.org_status as 'active' | 'invited' | 'suspended' : null;
        const roleKey = newUser.org_role === 'owner' || newUser.org_role === 'admin' ? 'admins' : 'members';
        return {
          ...prev,
          total: prev.total + 1,
          ...(statusKey ? { [statusKey]: prev[statusKey] + 1 } : {}),
          [roleKey]: prev[roleKey] + 1
        }
      })

      return newUser
    } catch (err) {
      throw err
    }
  }

  const updateUser = async (userId: string, userData: {
    first_name?: string
    last_name?: string
    display_name?: string
    org_role?: 'owner' | 'admin' | 'member'
    org_status?: 'active' | 'invited' | 'suspended' | 'removed'
  }) => {
    try {
      const updatedUser = await BusinessUsersService.updateUser(userId, userData)

      // Actualización optimista: solo actualizar el usuario modificado
      setUsers(prev => prev.map(user => user.id === userId ? updatedUser : user))

      // Si cambió el status u role, actualizar stats localmente
      if (userData.org_status || userData.org_role) {
        const oldUser = users.find(u => u.id === userId)
        if (oldUser) {
          setStats(prev => {
            const newStats = { ...prev }

            // Actualizar contadores de status
            if (userData.org_status && oldUser.org_status !== userData.org_status) {
              const oldStatus = oldUser.org_status as 'active' | 'invited' | 'suspended' | 'removed' | undefined;
              const newStatus = userData.org_status as 'active' | 'invited' | 'suspended' | 'removed' | undefined;
              
              if (oldStatus && oldStatus !== 'removed') {
                newStats[oldStatus] = Math.max(0, newStats[oldStatus] - 1)
              }
              if (newStatus && newStatus !== 'removed') {
                newStats[newStatus] = newStats[newStatus] + 1
              }
            }

            // Actualizar contadores de role
            if (userData.org_role && oldUser.org_role !== userData.org_role) {
              const oldIsAdmin = oldUser.org_role === 'owner' || oldUser.org_role === 'admin'
              const newIsAdmin = userData.org_role === 'owner' || userData.org_role === 'admin'

              if (oldIsAdmin !== newIsAdmin) {
                newStats.admins = oldIsAdmin ? newStats.admins - 1 : newStats.admins + 1
                newStats.members = oldIsAdmin ? newStats.members + 1 : newStats.members - 1
              }
            }

            return newStats
          })
        }
      }

      return updatedUser
    } catch (err) {
      throw err
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const userToDelete = users.find(u => u.id === userId)

      await BusinessUsersService.deleteUser(userId)

      // Actualización optimista: eliminar usuario y actualizar stats
      setUsers(prev => prev.filter(user => user.id !== userId))

      if (userToDelete) {
        setStats(prev => {
          const statusKey = userToDelete.org_status && userToDelete.org_status !== 'removed' ? userToDelete.org_status as 'active' | 'invited' | 'suspended' : null;
          const roleKey = userToDelete.org_role === 'owner' || userToDelete.org_role === 'admin' ? 'admins' : 'members';
          return {
            ...prev,
            total: Math.max(0, prev.total - 1),
            ...(statusKey ? { [statusKey]: Math.max(0, prev[statusKey] - 1) } : {}),
            [roleKey]: Math.max(0, prev[roleKey] - 1)
          }
        })
      }

      // Refetch forzarndo actualización real desde DB
      await fetchUsers()
    } catch (err) {
      throw err
    }
  }

  const resendInvitation = async (userId: string) => {
    try {
      await BusinessUsersService.resendInvitation(userId)
    } catch (err) {
      throw err
    }
  }

  const suspendUser = async (userId: string) => {
    try {
      const oldUser = users.find(u => u.id === userId)

      await BusinessUsersService.suspendUser(userId)

      // Actualización optimista
      setUsers(prev => prev.map(user =>
        user.id === userId
          ? { ...user, org_status: 'suspended' as const }
          : user
      ))

      // Actualizar stats si el usuario estaba activo
      if (oldUser?.org_status === 'active') {
        setStats(prev => ({
          ...prev,
          active: Math.max(0, prev.active - 1),
          suspended: prev.suspended + 1
        }))
      }
    } catch (err) {
      throw err
    }
  }

  const activateUser = async (userId: string) => {
    try {
      const oldUser = users.find(u => u.id === userId)

      await BusinessUsersService.activateUser(userId)

      // Actualización optimista
      setUsers(prev => prev.map(user =>
        user.id === userId
          ? { ...user, org_status: 'active' as const }
          : user
      ))

      // Actualizar stats si el usuario estaba suspendido
      if (oldUser?.org_status === 'suspended') {
        setStats(prev => ({
          ...prev,
          active: prev.active + 1,
          suspended: Math.max(0, prev.suspended - 1)
        }))
      }
    } catch (err) {
      throw err
    }
  }

  return {
    users,
    stats,
    isLoading,
    error,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    resendInvitation,
    suspendUser,
    activateUser
  }
}

