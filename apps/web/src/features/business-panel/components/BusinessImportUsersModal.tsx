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
  Users,
  Sparkles
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'

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
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Theme Colors
  const primaryColor = panelStyles?.primary_button_color || '#0EA5E9'
  const accentColor = panelStyles?.accent_color || '#10B981'

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
        {/* Backdrop - Transparent, just for closing */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0"
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
          <div
            className="rounded-2xl shadow-2xl overflow-hidden border border-white/10"
            style={{ backgroundColor: 'var(--org-card-background, #1a1f2e)' }}
          >
            {/* Two Column Layout - Scrollable */}
            <div className="flex flex-col lg:flex-row max-h-[85vh] overflow-y-auto lg:overflow-hidden">

              {/* Left Side - Preview & Info */}
              <div
                className="lg:w-80 w-full p-4 lg:p-8 flex flex-col border-b lg:border-b-0 lg:border-r border-white/5 shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)`
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
                      <Upload className="w-12 h-12" style={{ color: isDark ? '#FFFFFF' : primaryColor }} />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                    </motion.div>
                  </motion.div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-white mb-2 text-center">
                    {t('users.modals.import.title')}
                  </h2>
                  <p className="text-sm text-white/50 text-center mb-8">
                    {t('users.modals.import.subtitle')}
                  </p>

                  {/* Stats Preview */}
                  {importResult ? (
                    <div className="w-full space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                        <span className="text-white/60 text-sm">Total procesados</span>
                        <span className="font-bold text-white">{importResult.total}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                        <span className="text-green-400/80 text-sm">Importados</span>
                        <span className="font-bold text-green-400">{importResult.imported}</span>
                      </div>
                      {importResult.errors > 0 && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                          <span className="text-red-400/80 text-sm">Errores</span>
                          <span className="font-bold text-red-400">{importResult.errors}</span>
                        </div>
                      )}
                    </div>
                  ) : selectedFile ? (
                    <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                          <FileSpreadsheet className="w-5 h-5" style={{ color: primaryColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
                          <p className="text-xs text-white/40">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-full p-4 rounded-xl border-2 border-dashed text-center"
                      style={{
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#6C757D'
                      }}
                    >
                      <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: isDark ? 'rgba(255, 255, 255, 0.2)' : '#6C757D' }} />
                      <p className="text-xs" style={{ color: isDark ? 'rgba(255, 255, 255, 0.3)' : '#6C757D' }}>Ningún archivo seleccionado</p>
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
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#6C757D',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E9ECEF',
                    color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#0A2540'
                  }}
                  onMouseEnter={(e) => {
                    if (isDark) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                    } else {
                      e.currentTarget.style.backgroundColor = '#D1D5DB'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isDark) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                    } else {
                      e.currentTarget.style.backgroundColor = '#E9ECEF'
                    }
                  }}
                >
                  <Download className="w-4 h-4" style={{ color: isDark ? '#FFFFFF' : '#0A2540' }} />
                  {t('users.modals.import.downloadTemplate')}
                </motion.button>
              </div>

              {/* Right Side - Form */}
              <div className="flex-1 flex flex-col min-w-0 max-h-[85vh] lg:max-h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 lg:p-6 border-b border-white/5 shrink-0">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {importResult ? t('users.modals.import.resultTitle') : t('users.modals.import.uploadTitle')}
                    </h3>
                    <p className="text-sm text-white/40 mt-0.5">
                      {importResult ? t('users.modals.import.resultSubtitle') : t('users.modals.import.uploadSubtitle')}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/40" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 lg:p-6 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-sm text-red-400 flex-1">{error}</span>
                      <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/20 rounded">
                        <X className="w-4 h-4 text-red-400" />
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
                          backgroundColor: importResult.imported > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          border: `1px solid ${importResult.imported > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                        }}
                      >
                        {importResult.imported > 0 ? (
                          <CheckCircle className="w-8 h-8 text-green-400" />
                        ) : (
                          <XCircle className="w-8 h-8 text-red-400" />
                        )}
                        <div>
                          <p className="font-semibold text-white">
                            {importResult.imported > 0 ? t('users.modals.import.results.successTitle') : t('users.modals.import.results.noImportTitle')}
                          </p>
                          <p className="text-sm text-white/50 mt-0.5">
                            {importResult.imported} de {importResult.total} usuarios fueron importados correctamente
                          </p>
                        </div>
                      </div>

                      {/* Error Details */}
                      {importResult.errors > 0 && importResult.details.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-400" />
                            {t('users.modals.import.results.errorsFound')} ({importResult.errors})
                          </p>
                          <div className="max-h-40 lg:max-h-48 overflow-y-auto space-y-2 p-3 rounded-xl bg-red-500/5 border border-red-500/10" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                            {importResult.details.slice(0, 10).map((detail, index) => (
                              <div key={index} className="text-sm p-2 rounded-lg bg-red-500/10 text-red-400">
                                <span className="font-medium">Fila {detail.row}:</span> {detail.error}
                              </div>
                            ))}
                            {importResult.details.length > 10 && (
                              <p className="text-xs text-red-400/60 text-center py-2">
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
                          border: `2px dashed ${isDragging ? primaryColor : (isDark ? 'rgba(255,255,255,0.15)' : '#6C757D')}`,
                          backgroundColor: isDragging ? `${primaryColor}10` : (isDark ? 'rgba(255,255,255,0.02)' : '#E9ECEF')
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
                                className="w-12 h-12 mx-auto rounded-full border-3 border-t-transparent"
                                style={{ borderColor: `${primaryColor}30`, borderTopColor: primaryColor }}
                              />
                              <div>
                                <p className="font-medium text-white">{t('users.modals.import.loading.title')}</p>
                                <p className="text-sm text-white/40 mt-1">{t('users.modals.import.loading.subtitle')}</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div
                                className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-4"
                                style={{ backgroundColor: `${primaryColor}15` }}
                              >
                                <Upload className="w-7 h-7" style={{ color: isDark ? '#FFFFFF' : primaryColor }} />
                              </div>
                              <p className="font-medium mb-1" style={{ color: isDark ? '#FFFFFF' : '#0A2540' }}>
                                {isDragging ? t('users.modals.import.dragDrop.drop') : t('users.modals.import.dragDrop.drag')}
                              </p>
                              <p className="text-sm" style={{ color: isDark ? 'rgba(255, 255, 255, 0.4)' : '#6C757D' }}>
                                {t('users.modals.import.dragDrop.orKey')}
                              </p>
                            </>
                          )}
                        </div>
                      </motion.div>

                      {/* Format Info */}
                      <div className="rounded-xl p-4 bg-white/5 border border-white/5">
                        <p className="text-sm font-medium text-white mb-3 flex items-center gap-2">
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
                          ].map((item) => (
                            <div key={item.field} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <code
                                  className="px-2 py-0.5 rounded text-xs font-mono border font-semibold"
                                  style={{
                                    backgroundColor: isDark ? `${primaryColor}30` : `${primaryColor}15`,
                                    color: isDark ? '#FFFFFF' : '#0A2540',
                                    borderColor: isDark ? `${primaryColor}60` : '#6C757D'
                                  }}
                                >
                                  {item.field}
                                </code>
                                <span style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#6C757D' }}>{item.desc}</span>
                              </div>
                              {item.required && (
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                                    color: isDark ? '#FBBF24' : '#F59E0B'
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
                <div className="p-4 lg:p-6 border-t border-white/5 flex items-center justify-end gap-3 shrink-0">
                  {importResult ? (
                    <>
                      <button
                        onClick={handleReset}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        {t('users.buttons.importAnother')}
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
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
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                      >
                        {t('users.buttons.cancel')}
                      </button>
                      <motion.button
                        whileHover={{ scale: selectedFile ? 1.02 : 1 }}
                        whileTap={{ scale: selectedFile ? 0.98 : 1 }}
                        onClick={processFile}
                        disabled={!selectedFile || isImporting}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: selectedFile ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})` : 'rgba(255,255,255,0.1)',
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
