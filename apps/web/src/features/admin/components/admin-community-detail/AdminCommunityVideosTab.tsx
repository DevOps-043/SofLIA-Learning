import { PlayCircleIcon, VideoCameraIcon } from '@heroicons/react/24/outline'
import type { AdminCommunityVideo } from '../../types/admin-community-detail.types'

interface AdminCommunityVideosTabProps {
  videos: AdminCommunityVideo[]
}

function formatVideoDuration(duration: number | null | undefined) {
  if (!duration) {
    return null
  }

  return `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`
}

export function AdminCommunityVideosTab({ videos }: AdminCommunityVideosTabProps) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-8">
        <VideoCameraIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No hay videos en esta comunidad</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map(video => {
        const duration = formatVideoDuration(video.duration)

        return (
          <div key={video.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {video.thumbnail_url ? (
              <div className="aspect-video bg-gray-200 dark:bg-gray-700">
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <PlayCircleIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
            )}

            <div className="p-4">
              <h3 className="text-gray-900 dark:text-white font-medium mb-2">{video.title}</h3>
              {video.description ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{video.description}</p>
              ) : null}
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500">
                <span>{video.video_provider || 'Proveedor no definido'}</span>
                {duration ? <span>{duration}</span> : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
