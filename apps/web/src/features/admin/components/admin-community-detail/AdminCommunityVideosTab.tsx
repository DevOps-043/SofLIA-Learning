import { PlayCircle, Video } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
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

export function AdminCommunityVideosTab({
  videos,
}: AdminCommunityVideosTabProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  if (videos.length === 0) {
    return (
      <div className="py-10 text-center">
        <Video
          className="mx-auto mb-4 h-12 w-12"
          style={{ color: theme.subtextColor }}
        />
        <p className="text-sm" style={{ color: theme.subtextColor }}>
          {t('communityDetail.videos.empty')}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => {
        const duration = formatVideoDuration(video.duration)

        return (
          <div
            className="overflow-hidden rounded-2xl border"
            key={video.id}
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.borderColor,
            }}
          >
            {video.thumbnail_url ? (
              <div className="aspect-video" style={{ backgroundColor: theme.panelBg }}>
                <img
                  alt={video.title}
                  className="h-full w-full object-cover"
                  src={video.thumbnail_url}
                />
              </div>
            ) : (
              <div
                className="flex aspect-video items-center justify-center"
                style={{ backgroundColor: theme.panelBg }}
              >
                <PlayCircle
                  className="h-10 w-10"
                  style={{ color: theme.subtextColor }}
                />
              </div>
            )}

            <div className="p-4">
              <h3 className="mb-2 font-semibold" style={{ color: theme.textColor }}>
                {video.title}
              </h3>
              {video.description ? (
                <p
                  className="mb-3 line-clamp-2 text-sm"
                  style={{ color: theme.subtextColor }}
                >
                  {video.description}
                </p>
              ) : null}
              <div
                className="flex items-center justify-between text-sm"
                style={{ color: theme.subtextColor }}
              >
                <span>
                  {video.video_provider || t('communityDetail.videos.noProvider')}
                </span>
                {duration ? <span>{duration}</span> : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
