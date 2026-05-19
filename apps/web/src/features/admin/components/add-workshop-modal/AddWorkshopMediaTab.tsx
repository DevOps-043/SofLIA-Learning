'use client'

import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { ImageUploadCourse } from '../course-image-upload/ImageUploadCourse'

interface AddWorkshopMediaTabProps {
  thumbnailUrl: string
  disabled: boolean
  onThumbnailChange: (url: string) => void
}

export function AddWorkshopMediaTab({
  thumbnailUrl,
  disabled,
  onThumbnailChange,
}: AddWorkshopMediaTabProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <div>
      <label
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
        style={{ color: theme.mutedTextColor }}
      >
        {t('workshops.editor.config.imageLabel')}
      </label>
      <ImageUploadCourse value={thumbnailUrl} onChange={onThumbnailChange} disabled={disabled} />
    </div>
  )
}
