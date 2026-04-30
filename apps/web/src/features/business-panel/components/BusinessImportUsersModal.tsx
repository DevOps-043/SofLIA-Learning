'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
  Sparkles
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'

interface BusinessImportUsersModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

interface ImportResult {
  imported: number
  errors: number
  total: number
  details: Array<{ row: number; error: string; data: Record<string, unknown> }>
}

export function BusinessImportUsersModal({ isOpen, onClose, onImportComplete }: BusinessImportUsersModalProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const primaryColor = theme.primaryColor
  const accentColor = theme.accentColor
  const textColor = theme.textColor
  const subtextColor = theme.subtextColor
  const mutedText = theme.mutedTextColor
  const borderColor = theme.borderColor
  const inputBg = theme.inputBg
  const panelBg = theme.panelBg
  const cardBg = theme.cardBg
  const onPrimaryColor = theme.onPrimaryColor
  const successColor = theme.successColor
  const dangerColor = theme.dangerColor
  const warningColor = theme.warningColor
  const successBg = `${successColor}12`
  const successBorder = `${successColor}26`
  const dangerBg = `${dangerColor}12`
  const dangerBorder = `${dangerColor}26`
  const warningBg = `${warningColor}1F`

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/business/users/template', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(t('importUsers.errors.downloadTemplate'))
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'plantilla-importacion-usuarios.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('importUsers.errors.downloadTemplate'))
    }
  }

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError(t('importUsers.errors.invalidFileType'))
      return
    }
    setSelectedFile(file)
    setError(null)
  }

  const processFile = async () => {
    if (!selectedFile) return

    setIsImporting(true)
    setError(null)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/business/users/import', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al importar usuarios')
      }

      if (data.success && data.result) {
        setImportResult(data.result)
        if (data.result.imported > 0) {
          onImportComplete()
        }
      } else {
        throw new Error('Error en la respuesta del servidor')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar usuarios')
    } finally {
      setIsImporting(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleReset = () => {
    setError(null)
    setImportResult(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {/* Portal style - Covers entire viewport */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 99999 }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 backdrop-blur-sm"
          style={{ backgroundColor: theme.overlayBg }}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="rounded-2xl shadow-2xl overflow-hidden border" style={{ backgroundColor: panelBg, borderColor }}>
            {/* Two Column Layout - Scrollable */}
            <div className="flex flex-col lg:flex-row max-h-[85vh] overflow-y-auto lg:overflow-hidden">

              {/* Left Side - Preview & Info */}
              <div
                className="lg:w-80 w-full p-4 lg:p-8 flex flex-col border-b lg:border-b-0 lg:border-r shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)`,
                  borderColor
                }}
              >
                <div className="flex-1 flex flex-col items-center justify-center py-2 lg:py-0">
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative mb-6"
                  >
                    <div
                      className="w-24 h-24 rounded-2xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}30, ${accentColor}30)`,
                        border: `2px solid ${primaryColor}50`
                      }}
                    >
                      <Upload className="w-12 h-12" style={{ color: onPrimaryColor }} />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Sparkles className="w-4 h-4" style={{ color: onPrimaryColor }} />
                    </motion.div>
                  </motion.div>

                  {/* Title */}
                  <h2 className="text-xl font-bold mb-2 text-center" style={{ color: textColor }}>
                    {t('users.modals.import.title')}
                  </h2>
                  <p className="text-sm text-center mb-8" style={{ color: subtextColor }}>
                    {t('users.modals.import.subtitle')}
                  </p>

                  {/* Stats Preview */}
                  {importResult ? (
                    <div className="w-full space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: cardBg }}>
                        <span className="text-sm" style={{ color: subtextColor }}>Total procesados</span>
                        <span className="font-bold" style={{ color: textColor }}>{importResult.total}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: successBg, borderColor: successBorder }}>
                        <span className="text-sm" style={{ color: successColor }}>Importados</span>
                        <span className="font-bold" style={{ color: successColor }}>{importResult.imported}</span>
                      </div>
                      {importResult.errors > 0 && (
                        <div className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: dangerBg, borderColor: dangerBorder }}>
                          <span className="text-sm" style={{ color: dangerColor }}>Errores</span>
                          <span className="font-bold" style={{ color: dangerColor }}>{importResult.errors}</span>
                        </div>
                      )}
                    </div>
                  ) : selectedFile ? (
                    <div className="w-full p-4 rounded-xl border" style={{ backgroundColor: cardBg, borderColor }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                          <FileSpreadsheet className="w-5 h-5" style={{ color: primaryColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: textColor }}>{selectedFile.name}</p>
                          <p className="text-xs" style={{ color: mutedText }}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-full p-4 rounded-xl border-2 border-dashed text-center"
                      style={{
                        borderColor
                      }}
                    >
                      <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: mutedText }} />
                      <p className="text-xs" style={{ color: mutedText }}>Ningún archivo seleccionado</p>
                    </div>
                  )}
                </div>

                {/* Download Template Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownloadTemplate}
                  className="w-full py-3 px-4 rounded-xl border transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  style={{
                    borderColor,
                    backgroundColor: inputBg,
                    color: textColor
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.hoverBg
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = inputBg
                  }}
                >
                  <Download className="w-4 h-4" style={{ color: textColor }} />
                  {t('users.modals.import.downloadTemplate')}
                </motion.button>
              </div>

              {/* Right Side - Form */}
              <div className="flex-1 flex flex-col min-w-0 max-h-[85vh] lg:max-h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 lg:p-6 border-b shrink-0" style={{ borderColor }}>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: textColor }}>
                      {importResult ? t('users.modals.import.resultTitle') : t('users.modals.import.uploadTitle')}
                    </h3>
                    <p className="text-sm mt-0.5" style={{ color: mutedText }}>
                      {importResult ? t('users.modals.import.resultSubtitle') : t('users.modals.import.uploadSubtitle')}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg transition-colors"
                    onMouseEnter={(event) => {
                      event.currentTarget.style.backgroundColor = theme.hoverBg
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <X className="w-5 h-5" style={{ color: mutedText }} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 lg:p-6 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: `${borderColor} transparent` }}>
                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-4 rounded-xl border flex items-center gap-3"
                      style={{ backgroundColor: dangerBg, borderColor: dangerBorder }}
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: dangerColor }} />
                      <span className="text-sm flex-1" style={{ color: dangerColor }}>{error}</span>
                      <button
                        onClick={() => setError(null)}
                        className="p-1 rounded transition-colors"
                        onMouseEnter={(event) => {
                          event.currentTarget.style.backgroundColor = `${dangerColor}20`
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <X className="w-4 h-4" style={{ color: dangerColor }} />
                      </button>
                    </motion.div>
                  )}

                  {importResult ? (
                    /* Import Result */
                    <div className="space-y-4">
                      {/* Success Message */}
                      <div
                        className="p-5 rounded-xl flex items-center gap-4"
                        style={{
                          backgroundColor: importResult.imported > 0 ? successBg : dangerBg,
                          border: `1px solid ${importResult.imported > 0 ? successBorder : dangerBorder}`
                        }}
                      >
                        {importResult.imported > 0 ? (
                          <CheckCircle className="w-8 h-8" style={{ color: successColor }} />
                        ) : (
                          <XCircle className="w-8 h-8" style={{ color: dangerColor }} />
                        )}
                        <div>
                          <p className="font-semibold" style={{ color: textColor }}>
                            {importResult.imported > 0 ? t('users.modals.import.results.successTitle') : t('users.modals.import.results.noImportTitle')}
                          </p>
                          <p className="text-sm mt-0.5" style={{ color: subtextColor }}>
                            {importResult.imported} de {importResult.total} usuarios fueron importados correctamente
                          </p>
                        </div>
                      </div>

                      {/* Error Details */}
                      {importResult.errors > 0 && importResult.details.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: textColor }}>
                            <XCircle className="w-4 h-4" style={{ color: dangerColor }} />
                            {t('users.modals.import.results.errorsFound')} ({importResult.errors})
                          </p>
                          <div className="max-h-40 lg:max-h-48 overflow-y-auto space-y-2 p-3 rounded-xl border" style={{ backgroundColor: `${dangerColor}08`, borderColor: `${dangerColor}18`, scrollbarWidth: 'thin', scrollbarColor: `${borderColor} transparent` }}>
                            {importResult.details.slice(0, 10).map((detail, index) => (
                              <div key={index} className="text-sm p-2 rounded-lg" style={{ backgroundColor: dangerBg, color: dangerColor }}>
                                <span className="font-medium">Fila {detail.row}:</span> {detail.error}
                              </div>
                            ))}
                            {importResult.details.length > 10 && (
                              <p className="text-xs text-center py-2" style={{ color: `${dangerColor}B3` }}>
                                Y {importResult.details.length - 10} errores más...
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Upload Area */
                    <div className="space-y-4">
                      {/* Drop Zone */}
                      <motion.div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="relative rounded-xl cursor-pointer transition-all duration-200 p-8"
                        style={{
                          border: `2px dashed ${isDragging ? primaryColor : borderColor}`,
                          backgroundColor: isDragging ? `${primaryColor}10` : inputBg
                        }}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={handleFileInputChange}
                          className="hidden"
                          disabled={isImporting}
                        />

                        <div className="text-center">
                          {isImporting ? (
                            <div className="space-y-4">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-12 h-12 mx-auto rounded-full border-[3px] border-t-transparent"
                                style={{ borderColor: `${primaryColor}30`, borderTopColor: primaryColor }}
                              />
                              <div>
                                <p className="font-medium" style={{ color: textColor }}>{t('users.modals.import.loading.title')}</p>
                                <p className="text-sm mt-1" style={{ color: mutedText }}>{t('users.modals.import.loading.subtitle')}</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div
                                className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-4"
                                style={{ backgroundColor: `${primaryColor}15` }}
                              >
                                <Upload className="w-7 h-7" style={{ color: primaryColor }} />
                              </div>
                              <p className="font-medium mb-1" style={{ color: textColor }}>
                                {isDragging ? t('users.modals.import.dragDrop.drop') : t('users.modals.import.dragDrop.drag')}
                              </p>
                              <p className="text-sm" style={{ color: mutedText }}>
                                {t('users.modals.import.dragDrop.orKey')}
                              </p>
                            </>
                          )}
                        </div>
                      </motion.div>

                      {/* Format Info */}
                      <div className="rounded-xl p-4 border" style={{ backgroundColor: cardBg, borderColor }}>
                        <p className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: textColor }}>
                          <FileText className="w-4 h-4" style={{ color: accentColor }} />
                          {t('users.modals.import.format.title')}
                        </p>
                        <div className="space-y-2">
                          {[
                            { field: 'username', desc: t('users.modals.import.format.username'), required: true },
                            { field: 'email', desc: t('users.modals.import.format.email'), required: true },
                            { field: 'password', desc: t('users.modals.import.format.password'), required: true },
                            { field: 'job_title', desc: 'Cargo/Puesto', required: true },
                            { field: 'org_role', desc: t('users.modals.import.format.role'), required: false },
                            { field: 'date_of_birth', desc: t('users.modals.import.format.dateOfBirth'), required: false },
                            { field: 'gender', desc: t('users.modals.import.format.gender'), required: false },
                          ].map((item) => (
                            <div key={item.field} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <code
                                  className="px-2 py-0.5 rounded text-xs font-mono border font-semibold"
                                  style={{
                                    backgroundColor: `${primaryColor}15`,
                                    color: primaryColor,
                                    borderColor: `${primaryColor}40`
                                  }}
                                >
                                  {item.field}
                                </code>
                                <span style={{ color: subtextColor }}>{item.desc}</span>
                              </div>
                              {item.required && (
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: warningBg,
                                    color: warningColor
                                  }}
                                >
                                  {t('users.modals.import.format.required')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 lg:p-6 border-t flex items-center justify-end gap-3 shrink-0" style={{ borderColor }}>
                  {importResult ? (
                    <>
                      <button
                        onClick={handleReset}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        style={{ color: mutedText, backgroundColor: inputBg }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.backgroundColor = theme.hoverBg
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.backgroundColor = inputBg
                        }}
                      >
                        {t('users.buttons.importAnother')}
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                          color: onPrimaryColor,
                          boxShadow: `0 4px 15px ${primaryColor}40`
                        }}
                      >
                        {t('users.buttons.finish')}
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleClose}
                        disabled={isImporting}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                        style={{ color: mutedText, backgroundColor: inputBg }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.backgroundColor = theme.hoverBg
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.backgroundColor = inputBg
                        }}
                      >
                        {t('users.buttons.cancel')}
                      </button>
                      <motion.button
                        whileHover={{ scale: selectedFile ? 1.02 : 1 }}
                        whileTap={{ scale: selectedFile ? 0.98 : 1 }}
                        onClick={processFile}
                        disabled={!selectedFile || isImporting}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: selectedFile ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})` : inputBg,
                          color: selectedFile ? onPrimaryColor : mutedText,
                          boxShadow: selectedFile ? `0 4px 15px ${primaryColor}40` : 'none'
                        }}
                      >
                        {isImporting ? t('users.modals.import.loading.title') : t('users.buttons.import')}
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
