import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import type { AdminCommunity } from '../../services/adminCommunities.service'
import { getAdminCommunityCategoryColor, getAdminCommunityStatusColor } from './shared'

interface AdminCommunityDetailHeaderProps {
  community: AdminCommunity
  onBack: () => void
}

function getCommunityCategoryLabel(community: AdminCommunity) {
  if (community.visibility === 'private') {
    return 'Privada'
  }

  if (community.access_type === 'moderated') {
    return 'Moderada'
  }

  return 'Publica'
}

export function AdminCommunityDetailHeader({
  community,
  onBack
}: AdminCommunityDetailHeaderProps) {
  const categoryLabel = getCommunityCategoryLabel(community)
  const statusLabel = community.is_active ? 'Activa' : 'Inactiva'

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-6 gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{community.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">Administracion de comunidad</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getAdminCommunityCategoryColor(categoryLabel)}`}>
              {categoryLabel}
            </span>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getAdminCommunityStatusColor(statusLabel)}`}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
