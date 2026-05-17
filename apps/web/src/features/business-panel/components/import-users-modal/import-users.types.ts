import type { ChangeEvent, DragEvent, RefObject } from 'react'

export interface BusinessImportUsersModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

export interface ImportResult {
  imported: number
  errors: number
  total: number
  details: Array<{ row: number; error: string; data: Record<string, unknown> }>
}

export interface ImportUsersModalState {
  error: string | null
  fileInputRef: RefObject<HTMLInputElement>
  handleClose: () => void
  handleDownloadTemplate: () => Promise<void>
  handleDragLeave: (event: DragEvent) => void
  handleDragOver: (event: DragEvent) => void
  handleDrop: (event: DragEvent) => void
  handleFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleReset: () => void
  importResult: ImportResult | null
  isDragging: boolean
  isImporting: boolean
  processFile: () => Promise<void>
  selectedFile: File | null
  setError: (error: string | null) => void
}
