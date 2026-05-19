'use client'

import { ImageUpload } from '../ImageUpload'

interface ImageUploadCourseProps {
  disabled?: boolean
  onChange: (url: string) => void
  value?: string
}

export function ImageUploadCourse({
  disabled = false,
  onChange,
  value,
}: ImageUploadCourseProps) {
  return (
    <ImageUpload
      bucket="course-images"
      disabled={disabled}
      folder="thumbnails"
      onChange={onChange}
      value={value}
    />
  )
}
