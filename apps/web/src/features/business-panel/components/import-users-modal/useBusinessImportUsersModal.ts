'use client'

import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { downloadImportUsersTemplate, importUsersFile } from './import-users.api'
import type { ImportResult } from './import-users.types'

interface UseBusinessImportUsersModalParams {
  onClose: () => void
  onImportComplete: () => void
}

export function useBusinessImportUsersModal({
  onClose,
  onImportComplete,
}: UseBusinessImportUsersModalParams) {
  const { t } = useTranslation('business')
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError(t('importUsers.errors.invalidFileType'))
      return
    }
    setSelectedFile(file)
    setError(null)
  }
  const handleReset = () => {
    setError(null)
    setImportResult(null)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  const handleClose = () => {
    handleReset()
    onClose()
  }
  const handleDownloadTemplate = async () => {
    try {
      await downloadImportUsersTemplate()
    } catch {
      setError(t('importUsers.errors.downloadTemplate'))
    }
  }
  const processFile = async () => {
    if (!selectedFile) return
    setIsImporting(true)
    setError(null)
    setImportResult(null)
    try {
      const result = await importUsersFile(selectedFile)
      setImportResult(result)
      if (result.imported > 0) onImportComplete()
    } catch (err) {
      setError(resolveImportErrorMessage(err, t))
    } finally {
      setIsImporting(false)
    }
  }

  return {
    error,
    fileInputRef,
    handleClose,
    handleDownloadTemplate,
    handleDragLeave: (event: DragEvent) => {
      event.preventDefault()
      setIsDragging(false)
    },
    handleDragOver: (event: DragEvent) => {
      event.preventDefault()
      setIsDragging(true)
    },
    handleDrop: (event: DragEvent) => {
      event.preventDefault()
      setIsDragging(false)
      const file = event.dataTransfer.files?.[0]
      if (file) handleFileSelect(file)
    },
    handleFileInputChange: (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) handleFileSelect(file)
    },
    handleReset,
    importResult,
    isDragging,
    isImporting,
    processFile,
    selectedFile,
    setError,
  }
}

function resolveImportErrorMessage(
  error: unknown,
  t: (key: string) => string,
): string {
  const code = error instanceof Error ? error.message : 'processFile'

  if (code === 'invalidResponse') {
    return t('importUsers.errors.invalidResponse')
  }

  if (code === 'processFile') {
    return t('importUsers.errors.processFile')
  }

  if (code === 'timeout') {
    return t('importUsers.errors.timeout')
  }

  return code
}
