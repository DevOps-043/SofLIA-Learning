export function getAdminCommunityCategoryColor(category: string) {
  switch (category) {
    case 'Publica':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-800'
    case 'Privada':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-800'
    case 'Moderada':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-800'
  }
}

export function getAdminCommunityStatusColor(status: string) {
  switch (status) {
    case 'Activa':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-800'
    case 'Inactiva':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-800'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-800'
  }
}

export function getAdminCommunityRoleColor(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-800'
    case 'moderator':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-800'
    case 'member':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-800'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-800'
  }
}

export function getAdminCommunityRequestStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-800'
    case 'approved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-800'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-800'
  }
}
