'use client'

import { ImageUpload } from './ImageUpload'

interface ImageUploadCourseProps {
  value?: string
  disabled?: boolean
  onChange: (url: string) => void
}

export function ImageUploadCourse({
  value,
  disabled = false,
  onChange,
}: ImageUploadCourseProps) {
  return (
    <ImageUpload
      value={value}
      onChange={onChange}
      bucket="courses"
      folder="thumbnails"
      disabled={disabled}
    />
  )
}
