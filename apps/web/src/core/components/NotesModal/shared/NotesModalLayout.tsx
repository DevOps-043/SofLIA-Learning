'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  FileDown,
  Italic,
  Link,
  List,
  ListOrdered,
  Redo,
  Save,
  Type,
  Underline,
  Undo,
  X,
} from 'lucide-react';
import type { useNotesEditorState } from './useNotesEditorState';

type NotesEditorState = ReturnType<typeof useNotesEditorState>;
type NotesModalVariant = 'libraries' | 'native';

interface NotesModalLayoutProps {
  editor: NotesEditorState;
  isEditing: boolean;
  isOpen: boolean;
  onClose: () => void;
  onExportPdf: () => void | Promise<void>;
  variant: NotesModalVariant;
}

const notesModalVariantClasses: Record<NotesModalVariant, Record<string, string>> = {
  libraries: {
    addTagButton:
      'px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors',
    closeButton:
      'p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors',
    container:
      'bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700/50 w-full max-w-3xl',
    editorArea:
      'bg-white dark:bg-slate-700/30 border border-gray-300 dark:border-slate-600/50 rounded-xl p-4 min-h-0 overflow-hidden flex flex-col',
    exportButton:
      'flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700/40 dark:hover:bg-slate-700/60 text-gray-700 dark:text-white rounded-xl text-sm font-medium transition-colors border border-gray-200 dark:border-slate-600/50',
    footer:
      'flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 dark:border-slate-700/50 bg-white dark:bg-slate-800 shrink-0',
    footerHint:
      'hidden md:block text-[10px] text-gray-400 dark:text-slate-400 uppercase tracking-wider font-medium',
    header:
      'flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700/50 flex-shrink-0',
    headerIcon:
      'w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center',
    headerTitle: 'text-xl font-bold text-gray-900 dark:text-white',
    input:
      'w-full bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-lg font-semibold placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent',
    modalHeight:
      'max-h-[calc(100vh-2rem)] md:max-h-[70vh] md:h-[70vh] flex flex-col overflow-hidden',
    overlay:
      'fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 md:p-4',
    primaryButton:
      'flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0A2540] hover:bg-[#0d2f4d] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-md',
    secondaryButton:
      'px-5 py-2.5 bg-transparent hover:bg-gray-100 dark:hover:bg-slate-700/50 text-gray-500 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white rounded-xl text-sm font-medium transition-colors border border-transparent',
    tagChip:
      'inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-200 dark:border-blue-500/30',
    tagRemoveButton: 'hover:text-gray-900 dark:hover:text-white transition-colors',
    tagSection: 'mt-4 shrink-0',
    toolbar:
      'bg-white dark:bg-slate-700/30 border border-gray-300 dark:border-slate-600/50 rounded-xl p-3',
    toolbarButton:
      'p-2 hover:bg-gray-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors',
    toolbarButtonDisabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    toolbarDropdown:
      'px-3 py-2 bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50',
    toolbarGroup: 'flex gap-1',
    toolbarSeparator: 'w-px h-8 bg-gray-300 dark:bg-slate-600/50 mx-2',
    wrapper:
      'flex-1 flex flex-col p-4 gap-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-gray-100 dark:scrollbar-track-slate-800',
  },
  native: {
    addTagButton:
      'px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-lg text-xs font-medium transition-colors border border-gray-200 dark:border-white/10',
    closeButton:
      'p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white',
    container:
      'bg-white dark:bg-carbon rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-3xl',
    editorArea:
      'bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-xl p-4 min-h-0 overflow-hidden flex flex-col',
    exportButton:
      'hidden md:flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-xl text-sm font-medium transition-colors border border-gray-200 dark:border-white/10',
    footer:
      'flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-carbon shrink-0',
    footerHint:
      'hidden md:block text-[10px] text-gray-400 dark:text-white/30 uppercase tracking-wider font-medium',
    header:
      'flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/5 shrink-0 bg-white dark:bg-carbon',
    headerIcon:
      'w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700',
    headerTitle: 'text-lg font-semibold text-gray-900 dark:text-white tracking-tight',
    input:
      'w-full bg-gray-50 dark:!bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-lg font-medium placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-[#00D4B3]/50 focus:ring-1 focus:ring-[#00D4B3]/20 transition-all',
    modalHeight:
      'max-h-[calc(100vh-2rem)] md:max-h-[85vh] md:h-[75vh] flex flex-col overflow-hidden',
    overlay:
      'fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 md:p-4',
    primaryButton:
      'flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0A2540] hover:bg-[#0d2f4d] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-md',
    secondaryButton:
      'px-5 py-2.5 bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 hover:text-gray-900 dark:text-white/60 dark:hover:text-white rounded-xl text-sm font-medium transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10',
    tagChip:
      'inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-accent text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700',
    tagRemoveButton: 'hover:text-gray-900 dark:hover:text-white transition-colors',
    tagSection: 'mt-4 shrink-0',
    toolbar:
      'px-4 py-3 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-carbon shrink-0 overflow-x-auto scrollbar-hide',
    toolbarButton:
      'p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors',
    toolbarButtonDisabled: 'disabled:opacity-30 disabled:cursor-not-allowed',
    toolbarDropdown:
      'pl-3 pr-8 py-1.5 bg-transparent rounded-md text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:bg-gray-100 dark:focus:bg-white/10 appearance-none cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border-none',
    toolbarGroup:
      'flex gap-1 bg-white dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/5',
    toolbarSeparator: 'w-px h-6 bg-gray-300 dark:bg-white/10 mx-1',
    wrapper: 'flex-1 p-6 flex flex-col overflow-hidden min-h-0 bg-white dark:bg-carbon',
  },
};

export function NotesModalLayout({
  editor,
  isEditing,
  isOpen,
  onClose,
  onExportPdf,
  variant,
}: NotesModalLayoutProps) {
  const classes = notesModalVariantClasses[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          animate={{ opacity: 1 }}
          className={classes.overlay}
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className={`${classes.container} ${classes.modalHeight}`}
            exit={{ opacity: 0, scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.95 }}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={editor.handleShortcutKeyDown}
          >
            <div className={classes.header}>
              <div className="flex items-center gap-3">
                <div className={classes.headerIcon}>
                  <Type className="w-4 h-4 text-white dark:text-accent" />
                </div>
                <div>
                  <h2 className={classes.headerTitle}>
                    {isEditing ? 'Editar Nota' : 'Estudio > Notas'}
                  </h2>
                </div>
              </div>
              <button className={classes.closeButton} onClick={onClose}>
                <X className="w-5 h-5 text-gray-700 dark:text-slate-400" />
              </button>
            </div>

            <div className={classes.toolbar}>
              <div className="flex flex-wrap items-center gap-2">
                <div className={classes.toolbarGroup}>
                  <button
                    className={`${classes.toolbarButton} ${classes.toolbarButtonDisabled}`}
                    disabled={!editor.canUndo}
                    onClick={editor.undo}
                    title="Deshacer (Ctrl+Z)"
                  >
                    <Undo className="w-4 h-4 text-gray-600 dark:text-white/70" />
                  </button>
                  <button
                    className={`${classes.toolbarButton} ${classes.toolbarButtonDisabled}`}
                    disabled={!editor.canRedo}
                    onClick={editor.redo}
                    title="Rehacer (Ctrl+Y)"
                  >
                    <Redo className="w-4 h-4 text-gray-600 dark:text-white/70" />
                  </button>
                </div>
                <div className={classes.toolbarSeparator} />
                <div className={classes.toolbarGroup}>
                  <div className="relative flex items-center">
                    <select
                      className={classes.toolbarDropdown}
                      onChange={(event) => editor.applyHeading(event.target.value)}
                    >
                      <option value="Normal">Normal</option>
                      <option value="H1">H1</option>
                      <option value="H2">H2</option>
                      <option value="H3">H3</option>
                    </select>
                    {variant === 'native' && (
                      <ChevronDown className="absolute right-2 w-3 h-3 text-gray-500 pointer-events-none" />
                    )}
                  </div>
                  <div className="w-px h-4 bg-gray-300 dark:bg-white/10 mx-1 self-center" />
                  <button className={classes.toolbarButton} onClick={() => editor.execCommand('bold')} title="Negrita">
                    <Bold className="w-4 h-4 text-gray-600 dark:text-white/70" />
                  </button>
                  <button className={classes.toolbarButton} onClick={() => editor.execCommand('italic')} title="Cursiva">
                    <Italic className="w-4 h-4 text-gray-600 dark:text-white/70" />
                  </button>
                  <button className={classes.toolbarButton} onClick={() => editor.execCommand('underline')} title="Subrayado">
                    <Underline className="w-4 h-4 text-gray-600 dark:text-white/70" />
                  </button>
                  <button className={classes.toolbarButton} onClick={() => editor.execCommand('createLink')} title="Enlace">
                    <Link className="w-4 h-4 text-gray-600 dark:text-white/70" />
                  </button>
                </div>
                <div className={classes.toolbarSeparator} />
                <div className={classes.toolbarGroup}>
                  <button className={classes.toolbarButton} onClick={() => editor.applyList('ul')} title="Lista">
                    <List className="w-4 h-4 text-gray-600 dark:text-white/70" />
                  </button>
                  <button className={classes.toolbarButton} onClick={() => editor.applyList('ol')} title="Lista numerada">
                    <ListOrdered className="w-4 h-4 text-gray-600 dark:text-white/70" />
                  </button>
                  <div className="w-px h-4 bg-gray-300 dark:bg-white/10 mx-1 self-center" />
                  <button className={classes.toolbarButton} onClick={() => editor.execCommand('justifyLeft')} title="Alinear izquierda">
                    <AlignLeft className="w-4 h-4 text-gray-600 dark:text-white/70" />
                  </button>
                  <button className={classes.toolbarButton} onClick={() => editor.execCommand('justifyCenter')} title="Centrar">
                    <AlignCenter className="w-4 h-4 text-gray-600 dark:text-white/70" />
                  </button>
                  <button className={classes.toolbarButton} onClick={() => editor.execCommand('justifyRight')} title="Alinear derecha">
                    <AlignRight className="w-4 h-4 text-gray-600 dark:text-white/70" />
                  </button>
                </div>
              </div>
            </div>

            <div className={classes.wrapper}>
              <div className={variant === 'native' ? 'mb-4 shrink-0' : ''}>
                <input
                  className={classes.input}
                  onChange={(event) => editor.setTitle(event.target.value)}
                  placeholder="Titulo de la nota..."
                  type="text"
                  value={editor.title}
                />
              </div>
              <div className={classes.editorArea}>
                <div
                  className="notes-editor w-full flex-1 text-gray-900 dark:text-white/90 placeholder-gray-400 dark:placeholder-white/20 focus:outline-none resize-none overflow-y-auto"
                  contentEditable
                  data-placeholder="Comienza a escribir tu nota aqui..."
                  onInput={editor.updateContent}
                  ref={editor.editorRef}
                  style={{ lineHeight: '1.7', minHeight: '150px' }}
                />
              </div>
              <div className={classes.tagSection}>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-xs placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-[#00D4B3]/50 focus:ring-1 focus:ring-[#00D4B3]/20"
                    onChange={(event) => editor.setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        editor.addTag();
                      }
                    }}
                    placeholder="Agregar etiqueta..."
                    type="text"
                    value={editor.tagInput}
                  />
                  <button className={classes.addTagButton} onClick={editor.addTag}>
                    Agregar
                  </button>
                </div>
                {editor.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editor.tags.map((tag) => (
                      <span className={classes.tagChip} key={tag}>
                        {tag}
                        <button
                          className={classes.tagRemoveButton}
                          onClick={() => editor.removeTag(tag)}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={classes.footer}>
              <div className={classes.footerHint}>Ctrl+S guardar | Ctrl+Z deshacer</div>
              <div className="flex gap-3 w-full md:w-auto justify-end">
                <button className={classes.secondaryButton} onClick={onClose}>
                  Cancelar
                </button>
                <button className={classes.exportButton} onClick={onExportPdf}>
                  <FileDown className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button
                  className={classes.primaryButton}
                  disabled={editor.isSaving || !editor.hasContent}
                  onClick={() => {
                    void editor.handleSave();
                  }}
                >
                  <Save className="w-4 h-4" />
                  <span>{editor.isSaving ? 'Guardando...' : 'Guardar Nota'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
