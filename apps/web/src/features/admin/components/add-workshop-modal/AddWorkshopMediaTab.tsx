'use client'

import { ImageUploadCourse } from '../../../instructor/components/ImageUploadCourse'

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
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/70">
        Imagen del Taller
      </label>
      <ImageUploadCourse value={thumbnailUrl} onChange={onThumbnailChange} disabled={disabled} />
    </div>
  )
}
