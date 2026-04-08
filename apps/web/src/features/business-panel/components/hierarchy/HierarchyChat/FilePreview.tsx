import { File as FileIcon, X } from 'lucide-react'
import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'

interface FilePreviewProps {
  file: File
  preview: string | null
  onRemove: () => void
}

export function FilePreview({ file, preview, onRemove }: FilePreviewProps) {
  const theme = useBusinessPanelTheme()

  return (
    <div
      className="flex items-center gap-3 border-t px-4 py-3"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.dividerColor,
      }}
    >
      {preview ? (
        <img src={preview} alt="Preview" className="h-12 w-12 rounded-lg object-cover" />
      ) : (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-lg"
          style={{ backgroundColor: theme.hoverBg }}
        >
          <FileIcon className="h-6 w-6" style={{ color: theme.primaryColor }} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" style={{ color: theme.textColor }}>
          {file.name}
        </p>
        <p className="text-xs" style={{ color: theme.subtextColor }}>
          {(file.size / 1024).toFixed(1)} KB
        </p>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-1.5 transition-colors"
        style={{ backgroundColor: theme.hoverBg }}
      >
        <X className="h-4 w-4" style={{ color: theme.dangerColor }} />
      </button>
    </div>
  )
}
