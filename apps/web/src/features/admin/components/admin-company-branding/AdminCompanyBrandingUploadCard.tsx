'use client'

import type { CompanyBrandingUploadCardProps } from './types'
import { AdminCompanyBrandingEmptyState } from './AdminCompanyBrandingEmptyState'
import { AdminCompanyBrandingImageState } from './AdminCompanyBrandingImageState'
import { AdminCompanyBrandingUploadState } from './AdminCompanyBrandingUploadState'

export function AdminCompanyBrandingUploadCard({
  label,
  emptyLabel,
  emptyHint,
  actionLabel,
  imageUrl,
  uploading,
  inputRef,
  icon,
  onFileChange,
  onRemove,
  imageType,
  objectFit = 'contain',
}: CompanyBrandingUploadCardProps) {
  return (
    <div>
      <label className="mb-3 ml-1 block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
        {label}
      </label>
      <input
        type="file"
        ref={inputRef}
        onChange={(event) => onFileChange(event, imageType)}
        accept="image/*"
        className="hidden"
      />
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`group relative mb-4 flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-4 transition-all ${
          uploading
            ? 'border-accent/50 bg-accent/5'
            : 'border-gray-300 bg-gray-50 hover:border-accent/50 hover:bg-gray-100 dark:border-white/20 dark:bg-black/20 dark:hover:bg-white/5'
        }`}
      >
        {uploading ? <AdminCompanyBrandingUploadState /> : null}
        {!uploading && imageUrl ? (
          <AdminCompanyBrandingImageState
            actionLabel={actionLabel}
            imageUrl={imageUrl}
            objectFit={objectFit}
          />
        ) : null}
        {!uploading && !imageUrl ? (
          <AdminCompanyBrandingEmptyState
            emptyLabel={emptyLabel}
            emptyHint={emptyHint}
            icon={icon}
          />
        ) : null}
      </div>
      {imageUrl ? (
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-400 transition-colors hover:text-red-300"
        >
          Eliminar
        </button>
      ) : null}
    </div>
  )
}
