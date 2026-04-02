'use client'

import { EyeIcon, PencilIcon, TrashIcon, VideoCameraIcon } from '@heroicons/react/24/outline'
import type { CommunityVideo } from '../../types/instructor-community-detail.types'

interface InstructorCommunityVideosTabProps {
  videos: CommunityVideo[]
}

export function InstructorCommunityVideosTab({ videos }: InstructorCommunityVideosTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Videos de la Comunidad</h3>
      {videos.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex p-4 rounded-full bg-gray-700/50 mb-4">
            <VideoCameraIcon className="h-12 w-12 text-gray-400" />
          </div>
          <p className="text-gray-400 text-lg mb-1">No hay videos en esta comunidad</p>
          <p className="text-gray-500 text-sm">Los videos aparecerán aquí cuando se agreguen</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map(video => (
            <div key={video.id} className="bg-gradient-to-br from-gray-700/50 to-gray-800/30 rounded-xl border border-gray-600/30 overflow-hidden hover:border-blue-500/50 transition-all duration-200">
              {video.thumbnail_url ? (
                <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 relative overflow-hidden">
                  <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                </div>
              ) : null}
              <div className="p-4">
                <h4 className="text-white font-medium mb-2 line-clamp-2">{video.title}</h4>
                {video.description ? <p className="text-gray-300 text-sm mb-3 line-clamp-2 leading-relaxed">{video.description}</p> : null}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <span>{video.video_provider}</span>
                    {video.duration ? <span>• {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span> : null}
                  </div>
                  <div className="flex space-x-1">
                    <button className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-500/30">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-yellow-500/30">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/30">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
