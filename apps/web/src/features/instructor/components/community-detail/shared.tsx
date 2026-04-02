export type CommunityDetailTabId = 'posts' | 'members' | 'requests' | 'videos'

export function getCategoryColor(category: string) {
  switch (category) {
    case 'Pública':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'Privada':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'Moderada':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'Activa':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'Inactiva':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

export function getRoleColor(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    case 'moderator':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'member':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

export function getRequestStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'approved':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'rejected':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

export function getPostPreview(content: string | undefined, maxLength: number = 60) {
  if (!content) {
    return 'Post sin contenido'
  }

  return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content
}
