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
  NotebookPen,
  Redo,
  Save,
  Trash2,
  Underline,
  Undo,
  X,
  CornerDownLeft,
} from 'lucide-react';
import type { useNotesEditorState } from './useNotesEditorState';
import styles from './NotesModalLayout.module.css';

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

const notesModalClasses = {
  addTagButton: styles.addTagButton,
  closeButton: styles.closeButton,
  container: styles.container,
  editorArea: styles.editorArea,
  exportButton: styles.exportButton,
  footer: styles.footer,
  footerHint: styles.footerHint,
  header: styles.header,
  headerIcon: styles.headerIcon,
  headerTitle: styles.headerTitle,
  input: styles.titleInput,
  modalHeight: styles.modalHeight,
  overlay: styles.overlay,
  primaryButton: styles.primaryButton,
  secondaryButton: styles.secondaryButton,
  tagChip: styles.tagChip,
  tagRemoveButton: styles.tagRemoveButton,
  tagSection: styles.tagSection,
  toolbar: styles.toolbar,
  toolbarButton: styles.toolbarButton,
  toolbarButtonDisabled: styles.toolbarButtonDisabled,
  toolbarDropdown: styles.toolbarDropdown,
  toolbarGroup: styles.toolbarGroup,
  toolbarSeparator: styles.toolbarSeparator,
  wrapper: styles.wrapper,
};

export function NotesModalLayout({
  editor,
  isEditing,
  isOpen,
  onExportPdf,
  onDelete,
  variant,
}: NotesModalLayoutProps) {
  const classes = notesModalClasses;
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
            data-variant={variant}
            exit={{ opacity: 0, scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.95 }}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={editor.handleShortcutKeyDown}
          >
            <div className={classes.header}>
              <div className={styles.headerIdentity}>
                <div className={classes.headerIcon}>
                  <NotebookPen className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className={styles.headerCopy}>
                  <span className={styles.headerEyebrow}>Estudio / Notas</span>
                  <h2 className={classes.headerTitle}>
                    {isEditing
                      ? t('notes.modal.editTitle')
                      : t('notes.modal.createTitle')}
                  </h2>
                </div>
              </div>
              <div className={styles.headerActions}>
                {/* El guardado es automático (autoguardado mientras se escribe y
                    al cerrar). Mantenemos una única acción explícita de "Guardar"
                    en el pie del modal para no duplicar botones. Aquí solo cerrar. */}
                <button
                  aria-label={t('actions.close')}
                  className={classes.closeButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveAndClose();
                  }}
                  type="button"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
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
                  <div className={styles.toolbarMenu}>
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
              <div className={styles.titleField}>
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
                  className={`notes-editor notebook-prose ${styles.editable}`}
                  contentEditable
                  data-placeholder={t('notes.modal.contentPlaceholder')}
                  onClick={editor.handleEditorClick}
                  onInput={editor.updateContent}
                  ref={editor.editorRef}
                />
              </div>
              <div className={classes.tagSection}>
                <div className={styles.tagInputRow}>
                  <input
                    className={styles.tagInput}
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
                  <div className={styles.tagShortcut}>
                    <kbd className={styles.tagKbd}>
                      <CornerDownLeft className="w-2.5 h-2.5" />
                      <span>Enter</span>
                    </kbd>
                  </div>
                </div>
                {editor.tags.length > 0 && (
                  <div className={styles.tagList}>
                    {editor.tags.map((tag) => (
                      <span className={classes.tagChip} key={tag}>
                        {tag}
                        <button
                          className={classes.tagRemoveButton}
                          onClick={() => editor.removeTag(tag)}
                          type="button"
                        >
                          <X className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={classes.footer}>
              <div
                className={styles.saveStatus}
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
              <div className={styles.footerActions}>
                <button
                  type="button"
                  className={classes.primaryButton}
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
