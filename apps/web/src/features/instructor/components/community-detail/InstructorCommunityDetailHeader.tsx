'use client'

import { ArrowLeftIcon, GlobeAltIcon, LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { getCategoryColor, getStatusColor } from './shared'
import type { InstructorCommunity } from '../../services/instructorCommunities.service'

interface InstructorCommunityDetailHeaderProps {
  community: InstructorCommunity
  onBack: () => void
}

export function InstructorCommunityDetailHeader({ community, onBack }: InstructorCommunityDetailHeaderProps) {
  const category = community.visibility === 'private' ? 'Privada' : community.access_type === 'moderated' ? 'Moderada' : 'Pública'
  const status = community.is_active ? 'Activa' : 'Inactiva'

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-b border-gray-700/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200">
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">{community.name}</h1>
              <p className="text-gray-400 text-sm">Gestión de tu comunidad</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border ${getCategoryColor(category)}`}>
              {community.visibility === 'private' ? <LockClosedIcon className="h-4 w-4" /> : <GlobeAltIcon className="h-4 w-4" />}
              {category}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border ${getStatusColor(status)}`}>
              <ShieldCheckIcon className="h-4 w-4" />
              {status}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
