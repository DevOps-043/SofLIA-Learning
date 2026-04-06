'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Loader2 } from 'lucide-react'
import { useEditPostFormState } from './useEditPostFormState'
import { AttachmentPanel } from './AttachmentPanel'

interface EditablePost {
  id: string
  content: string
  attachment_url?: string | null
  attachment_type?: string | null
  attachment_data?: Record<string, unknown> | null
  is_edited?: boolean
  updated_at?: string
}

interface EditPostModalProps {
  isOpen: boolean
  onClose: () => void
  post: EditablePost
  communitySlug: string
  onSave: (updatedPost?: EditablePost) => void
}

export function EditPostModal({
  isOpen,
  onClose,
  post,
  communitySlug,
  onSave,
}: EditPostModalProps) {
  const {
    initialPost,
    internalIsOpen,
    content,
    setContent,
    isSaving,
    error,
    postAttachments,
    showYouTubeModal,
    setShowYouTubeModal,
    showPollModal,
    setShowPollModal,
    pendingAttachmentType,
    setPendingAttachmentType,
    mounted,
    isProcessingAttachment,
    handleClose,
    handleAttachmentSelect,
    handleYouTubeLinkConfirm,
    handlePollConfirm,
    handleRemoveAttachment,
    handlePasteImage,
    handleSubmit,
  } = useEditPostFormState({ isOpen, post, communitySlug, onSave, onClose })

  if (!mounted || !initialPost?.id || !internalIsOpen) return null

  const modalContent = (
    <>
      <AnimatePresence mode="wait">
        {internalIsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.stopPropagation()
                handleClose()
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              style={{
                zIndex: 99998,
                pointerEvents: isSaving || isProcessingAttachment ? 'none' : 'auto',
                cursor: isSaving || isProcessingAttachment ? 'not-allowed' : 'pointer',
              }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
              style={{ zIndex: 99999 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Editar Post
                  </h2>
                  <button
                    onClick={handleClose}
                    disabled={isSaving || isProcessingAttachment}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  {isProcessingAttachment && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Subiendo archivo, por favor espera...
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Contenido */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Contenido *
                      </label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onPaste={handlePasteImage}
                        rows={8}
                        required
                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="¿Qué estás pensando?"
                        disabled={isSaving || isProcessingAttachment}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {content.length} caracteres
                      </p>
                    </div>

                    <AttachmentPanel
                      postAttachments={postAttachments}
                      showYouTubeModal={showYouTubeModal}
                      showPollModal={showPollModal}
                      pendingAttachmentType={pendingAttachmentType}
                      isSaving={isSaving}
                      isProcessingAttachment={isProcessingAttachment}
                      onAttachmentSelect={handleAttachmentSelect}
                      onRemoveAttachment={handleRemoveAttachment}
                      onYouTubeModalClose={() => {
                        setShowYouTubeModal(false)
                        setPendingAttachmentType(null)
                      }}
                      onYouTubeLinkConfirm={handleYouTubeLinkConfirm}
                      onPollModalClose={() => setShowPollModal(false)}
                      onPollConfirm={handlePollConfirm}
                    />
                  </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSaving || isProcessingAttachment}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingAttachment ? 'Procesando...' : 'Cancelar'}
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSaving || isProcessingAttachment || !content.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSaving || isProcessingAttachment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isProcessingAttachment ? 'Subiendo archivo...' : 'Guardando...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Guardar cambios
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )

  return createPortal(modalContent, document.body)
}
