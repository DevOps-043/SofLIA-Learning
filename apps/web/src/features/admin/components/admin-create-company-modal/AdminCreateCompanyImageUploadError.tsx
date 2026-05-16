'use client'

interface AdminCreateCompanyImageUploadErrorProps {
  error: string
  onDismiss: () => void
}

export function AdminCreateCompanyImageUploadError({
  error,
  onDismiss,
}: AdminCreateCompanyImageUploadErrorProps) {
  return (
    <p className="mb-3 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
      <span>{error}</span>
      <button onClick={onDismiss} className="ml-4 text-red-400 hover:text-red-300">
        ×
      </button>
    </p>
  )
}
