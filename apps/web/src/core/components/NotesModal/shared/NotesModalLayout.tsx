'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronDown,
  FileDown,
  Italic,
  Link,
  List,
  ListOrdered,
  Loader2,
  MoreHorizontal,
  Redo,
  Save,
  Trash2,
  Type,
  Underline,
  Undo,
  X,
  CornerDownLeft,
} from 'lucide-react';
import type { useNotesEditorState } from './useNotesEditorState';

type NotesEditorState = ReturnType<typeof useNotesEditorState>;
type NotesModalVariant = 'libraries' | 'native';

interface NotesModalLayoutProps {
  editor: NotesEditorState;
  isEditing: boolean;
  isOpen: boolean;
  onExportPdf: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  variant: NotesModalVariant;
}

const notesModalVariantClasses: Record<NotesModalVariant, Record<string, string>> = {
  libraries: {
    addTagButton:
      'px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors',
    closeButton:
      'p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white',
    container:
      'h-[100dvh] w-full overflow-hidden border-0 bg-white shadow-2xl dark:bg-carbon-900 md:h-auto md:w-full md:max-w-3xl md:rounded-2xl md:border md:border-gray-200 md:dark:border-white/10',
    editorArea:
      'flex min-h-0 flex-1 flex-col overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-carbon-900 md:rounded-none md:border-none',
    exportButton:
      'hidden md:flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-xl text-sm font-medium transition-colors border border-gray-200 dark:border-white/10',
    footer:
      'flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-carbon-900 shrink-0',
    footerHint:
      'hidden md:block text-[10px] text-gray-400 dark:text-white/30 uppercase tracking-wider font-medium',
    header:
      'flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 dark:border-white/10 shrink-0 bg-white dark:bg-carbon-900',
    headerIcon:
      'w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700',
    headerTitle: 'text-lg font-semibold text-gray-900 dark:text-white tracking-tight',
    input:
      'w-full bg-white dark:bg-carbon-800 border border-gray-300 dark:border-white/10 rounded-2xl md:rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base md:text-lg font-semibold placeholder-gray-500 dark:placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-transparent',
    modalHeight:
      'max-h-none md:max-h-[75vh] md:h-[75vh] flex flex-col overflow-hidden',
    overlay:
      'fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-stretch justify-stretch p-0 md:items-center md:justify-center md:p-4',
    primaryButton:
      'inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-xs font-bold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:px-5 md:text-sm',
    secondaryButton:
      'px-5 py-2.5 bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 hover:text-gray-900 dark:text-white/60 dark:hover:text-white rounded-xl text-sm font-medium transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10',
    tagChip:
      'inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-carbon-800 text-accent text-xs font-medium rounded-full border border-gray-200 dark:border-white/5',
    tagRemoveButton: 'hover:text-gray-900 dark:hover:text-white transition-colors',
    tagSection: 'mt-4 shrink-0',
    toolbar:
      'px-3 py-2 md:px-4 md:py-3 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-carbon-900 shrink-0',
    toolbarButton:
      'p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors',
    toolbarButtonDisabled: 'disabled:opacity-30 disabled:cursor-not-allowed',
    toolbarDropdown:
      'pl-3 pr-8 py-1.5 bg-transparent rounded-md text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:bg-gray-100 dark:focus:bg-white/10 appearance-none cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border-none',
    toolbarGroup: 'flex gap-1 bg-white dark:bg-carbon-800 p-1 rounded-lg border border-gray-200 dark:border-white/5',
    toolbarSeparator: 'w-px h-6 bg-gray-300 dark:bg-white/10 mx-1',
    wrapper:
      'flex-1 p-4 md:p-6 flex flex-col overflow-hidden min-h-0 bg-white dark:bg-carbon-900',
  },
  native: {
    addTagButton:
      'px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-lg text-xs font-medium transition-colors border border-gray-200 dark:border-white/10',
    closeButton:
      'p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white',
    container:
      'h-[100dvh] w-full overflow-hidden border-0 bg-white shadow-2xl dark:bg-slate-900 md:h-auto md:w-full md:max-w-3xl md:rounded-2xl md:border md:border-gray-200 md:dark:border-white/10 flex flex-col',
    editorArea:
      'flex-1 bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700/80 rounded-2xl md:rounded-xl p-4 min-h-0 overflow-y-auto flex flex-col',
    exportButton:
      'hidden md:flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-xl text-sm font-medium transition-colors border border-gray-200 dark:border-white/10',
    footer:
      'flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 shrink-0',
    footerHint:
      'hidden md:block text-[10px] text-gray-400 dark:text-white/30 uppercase tracking-wider font-medium',
    header:
      'flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 dark:border-white/10 shrink-0 bg-white dark:bg-slate-900',
    headerIcon:
      'w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700',
    headerTitle: 'text-lg font-semibold text-gray-900 dark:text-white tracking-tight',
    input:
      'w-full bg-gray-50 dark:!bg-slate-800/80 border border-gray-200 dark:border-slate-700/80 rounded-2xl md:rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base md:text-lg font-medium placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all',
    modalHeight:
      'max-h-none md:max-h-[85vh] md:h-[75vh] flex flex-col overflow-hidden',
    overlay:
      'fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-stretch justify-stretch p-0 md:items-center md:justify-center md:p-4',
    primaryButton:
      'inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-xs font-bold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:px-5 md:text-sm',
    secondaryButton:
      'px-5 py-2.5 bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 hover:text-gray-900 dark:text-white/60 dark:hover:text-white rounded-xl text-sm font-medium transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10',
    tagChip:
      'inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-accent text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700',
    tagRemoveButton: 'hover:text-gray-900 dark:hover:text-white transition-colors',
    tagSection: 'mt-4 shrink-0',
    toolbar:
      'px-3 py-2 md:px-4 md:py-3 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-900 shrink-0',
    toolbarButton:
      'p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors',
    toolbarButtonDisabled: 'disabled:opacity-30 disabled:cursor-not-allowed',
    toolbarDropdown:
      'pl-3 pr-8 py-1.5 bg-transparent rounded-md text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:bg-gray-100 dark:focus:bg-white/10 appearance-none cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border-none',
    toolbarGroup:
      'flex gap-1 bg-white dark:bg-slate-800/80 p-1 rounded-lg border border-gray-200 dark:border-slate-700/50',
    toolbarSeparator: 'w-px h-6 bg-gray-300 dark:bg-white/10 mx-1',
    wrapper: 'flex-1 p-4 md:p-6 flex flex-col overflow-hidden min-h-0 bg-white dark:bg-slate-900',
  },
};

export function NotesModalLayout({
  editor,
  isEditing,
  isOpen,
  onExportPdf,
  onDelete,
  variant,
}: NotesModalLayoutProps) {
  const classes = notesModalVariantClasses[variant];
  const { t } = useTranslation('common');
  const [isToolbarMenuOpen, setIsToolbarMenuOpen] = React.useState(false);

  // Evita que el "click fantasma" del toque que abre el modal en dispositivos
  // táctiles impacte el overlay y lo cierre de inmediato (síntoma de "las notas
  // no se abren" en móvil). El overlay solo cierra una vez transcurrido un
  // breve periodo tras la apertura.
  const [isOverlayDismissible, setIsOverlayDismissible] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setIsOverlayDismissible(false);
      return;
    }

    const timeoutId = window.setTimeout(() => setIsOverlayDismissible(true), 300);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  // La nota se autoguarda al cerrar: la X, el clic fuera y el botón "Guardar"
  // persisten y SIEMPRE cierran (nunca queda atrapado por un guardado fallido).
  const handleSaveAndClose = () => {
    void editor.saveAndClose();
  };
  const runToolbarAction = (action: () => void | Promise<void>) => {
    void action();
    setIsToolbarMenuOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          animate={{ opacity: 1 }}
          className={classes.overlay}
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isOverlayDismissible) {
              return;
            }
            handleSaveAndClose();
          }}
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
                  <Type className="w-4 h-4 text-primary dark:text-accent" />
                </div>
                <div>
                  <h2 className={classes.headerTitle}>
                    {isEditing
                      ? t('notes.modal.editTitle')
                      : t('notes.modal.createTitle')}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={classes.primaryButton}
                  disabled={editor.isSaving || !editor.hasContent}
                  onClick={(e) => {
                    e.stopPropagation();
                    void editor.handleSave();
                  }}
                  type="button"
                >
                  <Save className="h-4 w-4" />
                  <span>{editor.isSaving ? t('actions.saving') : t('actions.save')}</span>
                </button>
                <button
                  type="button"
                  aria-label={t('actions.close')}
                  className={classes.closeButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveAndClose();
                  }}
                  type="button"
                >
                  <X className="w-5 h-5 text-gray-700 dark:text-slate-400" />
                </button>
              </div>
            </div>

            <div className={classes.toolbar}>
              <div className="relative flex w-full items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className={classes.toolbarGroup}>
                    <button
                      className={`${classes.toolbarButton} ${classes.toolbarButtonDisabled}`}
                      disabled={!editor.canUndo}
                      onClick={editor.undo}
                      title={t('notes.modal.toolbar.undo')}
                      type="button"
                    >
                      <Undo className="w-4 h-4 text-gray-600 dark:text-white/70" />
                    </button>
                    <button
                      className={`${classes.toolbarButton} ${classes.toolbarButtonDisabled}`}
                      disabled={!editor.canRedo}
                      onClick={editor.redo}
                      title={t('notes.modal.toolbar.redo')}
                      type="button"
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
                        <option value="Normal">{t('notes.modal.toolbar.normal')}</option>
                        <option value="H1">H1</option>
                        <option value="H2">H2</option>
                        <option value="H3">H3</option>
                      </select>
                      {variant === 'native' && (
                        <ChevronDown className="absolute right-2 w-3 h-3 text-gray-500 pointer-events-none" />
                      )}
                    </div>
                    <div className="w-px h-4 bg-gray-300 dark:bg-white/10 mx-1 self-center" />
                    <button className={classes.toolbarButton} onClick={() => editor.execCommand('bold')} title={t('notes.modal.toolbar.bold')} type="button">
                      <Bold className="w-4 h-4 text-gray-600 dark:text-white/70" />
                    </button>
                    <button className={classes.toolbarButton} onClick={() => editor.execCommand('italic')} title={t('notes.modal.toolbar.italic')} type="button">
                      <Italic className="w-4 h-4 text-gray-600 dark:text-white/70" />
                    </button>
                    <button className={classes.toolbarButton} onClick={() => editor.execCommand('underline')} title={t('notes.modal.toolbar.underline')} type="button">
                      <Underline className="w-4 h-4 text-gray-600 dark:text-white/70" />
                    </button>
                    <button
                      className={classes.toolbarButton}
                      onClick={editor.applyLink}
                      onMouseDown={(event) => event.preventDefault()}
                      title={t('notes.modal.toolbar.link')}
                      type="button"
                    >
                      <Link className="w-4 h-4 text-gray-600 dark:text-white/70" />
                    </button>
                  </div>
                  <div className={`${classes.toolbarSeparator} hidden md:block`} />
                  <div className={`${classes.toolbarGroup} hidden md:flex`}>
                    <button className={classes.toolbarButton} onClick={() => editor.applyList('ul')} title={t('notes.modal.toolbar.bulletList')} type="button">
                      <List className="w-4 h-4 text-gray-600 dark:text-white/70" />
                    </button>
                    <button className={classes.toolbarButton} onClick={() => editor.applyList('ol')} title={t('notes.modal.toolbar.numberedList')} type="button">
                      <ListOrdered className="w-4 h-4 text-gray-600 dark:text-white/70" />
                    </button>
                    <div className="w-px h-4 bg-gray-300 dark:bg-white/10 mx-1 self-center" />
                    <button className={classes.toolbarButton} onClick={() => editor.execCommand('justifyLeft')} title={t('notes.modal.toolbar.alignLeft')} type="button">
                      <AlignLeft className="w-4 h-4 text-gray-600 dark:text-white/70" />
                    </button>
                    <button className={classes.toolbarButton} onClick={() => editor.execCommand('justifyCenter')} title={t('notes.modal.toolbar.alignCenter')} type="button">
                      <AlignCenter className="w-4 h-4 text-gray-600 dark:text-white/70" />
                    </button>
                    <button className={classes.toolbarButton} onClick={() => editor.execCommand('justifyRight')} title={t('notes.modal.toolbar.alignRight')} type="button">
                      <AlignRight className="w-4 h-4 text-gray-600 dark:text-white/70" />
                    </button>
                  </div>
                </div>

                {/* Botones PDF y Eliminar movidos a la barra de formato */}
                <div className="flex items-center gap-2 ml-auto shrink-0 justify-end">
                  <button className={classes.exportButton || classes.toolbarButton} onClick={onExportPdf} title={t('notes.modal.toolbar.exportPdf')} type="button">
                    <FileDown className="w-4 h-4 text-gray-600 dark:text-white/70" />
                    <span className="hidden md:inline md:text-xs">PDF</span>
                  </button>
                  {onDelete && isEditing && (
                    <button
                      className={`${classes.toolbarButton} hidden text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10 md:block`}
                      onClick={onDelete}
                      title={t('notes.modal.deleteTitle')}
                      type="button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    aria-expanded={isToolbarMenuOpen}
                    aria-label={t('notes.modal.toolbar.moreTools')}
                    className={`${classes.toolbarButton} md:hidden`}
                    onClick={() => setIsToolbarMenuOpen((current) => !current)}
                    title={t('notes.modal.toolbar.moreTools')}
                    type="button"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-600 dark:text-white/70" />
                  </button>
                </div>
                {isToolbarMenuOpen && (
                  <div className="absolute right-0 top-11 z-20 w-48 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-carbon-900">
                    <div className="grid grid-cols-3 gap-1">
                      <button className={classes.toolbarButton} onClick={() => runToolbarAction(() => editor.applyList('ul'))} title={t('notes.modal.toolbar.bulletList')} type="button">
                        <List className="mx-auto w-4 h-4 text-gray-600 dark:text-white/70" />
                      </button>
                      <button className={classes.toolbarButton} onClick={() => runToolbarAction(() => editor.applyList('ol'))} title={t('notes.modal.toolbar.numberedList')} type="button">
                        <ListOrdered className="mx-auto w-4 h-4 text-gray-600 dark:text-white/70" />
                      </button>
                      <button className={classes.toolbarButton} onClick={() => runToolbarAction(() => onExportPdf())} title={t('notes.modal.toolbar.exportPdf')} type="button">
                        <FileDown className="mx-auto w-4 h-4 text-gray-600 dark:text-white/70" />
                      </button>
                      <button className={classes.toolbarButton} onClick={() => runToolbarAction(() => editor.execCommand('justifyLeft'))} title={t('notes.modal.toolbar.alignLeft')} type="button">
                        <AlignLeft className="mx-auto w-4 h-4 text-gray-600 dark:text-white/70" />
                      </button>
                      <button className={classes.toolbarButton} onClick={() => runToolbarAction(() => editor.execCommand('justifyCenter'))} title={t('notes.modal.toolbar.alignCenter')} type="button">
                        <AlignCenter className="mx-auto w-4 h-4 text-gray-600 dark:text-white/70" />
                      </button>
                      <button className={classes.toolbarButton} onClick={() => runToolbarAction(() => editor.execCommand('justifyRight'))} title={t('notes.modal.toolbar.alignRight')} type="button">
                        <AlignRight className="mx-auto w-4 h-4 text-gray-600 dark:text-white/70" />
                      </button>
                    </div>
                    {onDelete && isEditing && (
                      <button
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        onClick={() => runToolbarAction(() => onDelete())}
                        type="button"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('notes.modal.deleteTitle')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className={classes.wrapper}>
              <div className="mb-4 shrink-0">
                <input
                  className={classes.input}
                  onChange={(event) => editor.setTitle(event.target.value)}
                  placeholder={t('notes.modal.titlePlaceholder')}
                  type="text"
                  value={editor.title}
                />
              </div>
              <div className={classes.editorArea}>
                <div
                  className="notes-editor w-full flex-1 text-gray-900 dark:text-white/90 placeholder-gray-400 dark:placeholder-white/20 focus:outline-none resize-none break-words"
                  contentEditable
                  data-placeholder={t('notes.modal.contentPlaceholder')}
                  onClick={editor.handleEditorClick}
                  onInput={editor.updateContent}
                  ref={editor.editorRef}
                  style={{ lineHeight: '1.7', minHeight: '150px' }}
                />
              </div>
              <div className={classes.tagSection}>
                <div className="relative flex items-center mb-3">
                  <input
                    className="flex-1 bg-gray-50 dark:bg-carbon-800 border border-gray-200 dark:border-white/10 rounded-lg pl-3 pr-10 py-2 text-gray-900 dark:text-white text-xs placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                    onChange={(event) => editor.setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        editor.addTag();
                      }
                    }}
                    placeholder={t('notes.modal.tagPlaceholder')}
                    type="text"
                    value={editor.tagInput}
                  />
                  <div className="absolute right-3 flex items-center pointer-events-none">
                    <kbd className="hidden sm:flex h-5 items-center gap-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-carbon-900 px-1.5 font-sans text-[10px] font-medium text-gray-400 dark:text-white/30">
                      <CornerDownLeft className="w-2.5 h-2.5" />
                      <span>Enter</span>
                    </kbd>
                    <CornerDownLeft className="sm:hidden w-3.5 h-3.5 text-gray-400 dark:text-white/30" />
                  </div>
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
              <div
                className="flex items-center gap-1.5 text-[11px] font-medium"
                aria-live="polite"
              >
                {editor.saveStatus === 'saving' && (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 dark:text-white/40" />
                    <span className="text-gray-500 dark:text-white/50">{t('actions.saving')}</span>
                  </>
                )}
                {editor.saveStatus === 'saved' && (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-gray-500 dark:text-white/50">{t('notes.modal.saveStatus.saved')}</span>
                  </>
                )}
                {editor.saveStatus === 'error' && (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-red-500">{t('notes.modal.saveStatus.error')}</span>
                  </>
                )}
                {editor.saveStatus === 'idle' && (
                  <span className={classes.footerHint}>{t('notes.modal.autoSaveHint')}</span>
                )}
              </div>
              <div className="flex w-full items-center justify-end gap-3 md:w-auto">
                <button
                  type="button"
                  className={`${classes.primaryButton} flex-1 md:flex-none`}
                  disabled={editor.isSaving}
                  onClick={handleSaveAndClose}
                >
                  <Save className="w-4 h-4" />
                  {editor.isSaving ? t('actions.saving') : t('actions.save')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
