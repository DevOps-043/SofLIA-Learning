import React, { useEffect, useRef, useState } from 'react';
import type { NoteDraft, NotesModalProps } from '../types';
import {
  addUniqueNoteTag,
  buildNoteLinkHtml,
  createNotesHistoryState,
  getNoteShortcutAction,
  hasNoteContent,
  NOTES_EDITOR_STYLE_CONTENT,
  NOTES_EDITOR_STYLE_ID,
  normalizeNoteLinkUrl,
  pushNotesHistoryEntry,
  removeNoteTag,
  stepNotesHistory,
  type NotesHistoryState,
} from './notes-modal.utils';

function serializeNoteSnapshot(title: string, content: string, tags: string[]): string {
  return JSON.stringify([title.trim(), content.trim(), tags]);
}

export type NoteSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseNotesEditorStateResult {
  addTag: () => void;
  applyHeading: (level: string) => void;
  applyLink: () => void;
  applyList: (type: 'ol' | 'ul') => void;
  canRedo: boolean;
  canUndo: boolean;
  close: () => void;
  content: string;
  editorRef: React.RefObject<HTMLDivElement>;
  execCommand: (command: string, value?: string) => void;
  saveAndClose: () => Promise<void>;
  saveNote: () => Promise<boolean>;
  handleEditorClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleShortcutKeyDown: (event: React.KeyboardEvent) => void;
  hasContent: boolean;
  isSaving: boolean;
  saveStatus: NoteSaveStatus;
  redo: () => void;
  removeTag: (tagToRemove: string) => void;
  setTagInput: React.Dispatch<React.SetStateAction<string>>;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  tagInput: string;
  tags: string[];
  title: string;
  undo: () => void;
  updateContent: () => void;
}

export function useNotesEditorState({
  initialNote,
  isOpen,
  onClose,
  onSave,
  onPersist,
}: Pick<NotesModalProps, 'initialNote' | 'isOpen' | 'onClose' | 'onSave' | 'onPersist'>): UseNotesEditorStateResult {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<NoteSaveStatus>('idle');
  const [historyState, setHistoryState] = useState<NotesHistoryState>(
    createNotesHistoryState()
  );

  const editorRef = useRef<HTMLDivElement>(null);
  // Id real de la nota en curso. Para notas nuevas empieza vacío y se completa
  // tras el primer guardado (autoguardado), de modo que los siguientes guardados
  // actualicen la misma nota en lugar de duplicarla.
  const liveNoteIdRef = useRef<string>(initialNote?.id ?? '');
  // Serializa los guardados para que el autoguardado y el guardado al cerrar no
  // se pisen ni creen notas duplicadas.
  const inflightSaveRef = useRef<Promise<boolean> | null>(null);
  // Última instantánea persistida: evita reescribir contenido sin cambios
  // (incluido el guardado "fantasma" justo al abrir la nota).
  const lastSavedSnapshotRef = useRef<string>('');

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setContent('');
      setTags([]);
      setTagInput('');
      setIsSaving(false);
      setSaveStatus('idle');
      setHistoryState(createNotesHistoryState());
      liveNoteIdRef.current = '';
      inflightSaveRef.current = null;
      lastSavedSnapshotRef.current = '';

      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }

      return;
    }

    const nextContent = initialNote?.content || '';
    const nextTitle = initialNote?.title || '';
    const nextTags = initialNote?.tags || [];
    setTitle(nextTitle);
    setContent(nextContent);
    setTags(nextTags);
    setTagInput('');
    setIsSaving(false);
    setSaveStatus('idle');
    setHistoryState(createNotesHistoryState(nextContent));
    liveNoteIdRef.current = initialNote?.id ?? '';
    inflightSaveRef.current = null;
    // La nota recién abierta ya está persistida tal cual: registramos su
    // instantánea para no reescribirla si el usuario no cambia nada.
    lastSavedSnapshotRef.current = serializeNoteSnapshot(nextTitle, nextContent, nextTags);

    if (editorRef.current) {
      editorRef.current.innerHTML = nextContent;

      if (initialNote) {
        requestAnimationFrame(() => {
          moveCursorToEnd();
        });
      }
    }
  }, [initialNote, isOpen]);

  // Nota: NO sincronizamos `content` -> `editorRef.innerHTML` en un efecto.
  // El DOM del editor ya es la fuente de verdad mientras se escribe: cada cambio
  // que parte del estado (apertura de nota, undo/redo) escribe el innerHTML de
  // forma directa. Un efecto reactivo sobre `content` reescribía el innerHTML en
  // medio de la escritura rápida, reseteando el caret y descartando pulsaciones,
  // lo que provocaba que la nota se guardara con contenido incompleto o alterado.

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    if (document.getElementById(NOTES_EDITOR_STYLE_ID)) {
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = NOTES_EDITOR_STYLE_ID;
    styleElement.textContent = NOTES_EDITOR_STYLE_CONTENT;
    document.head.appendChild(styleElement);

    return () => {
      const existingStyle = document.getElementById(NOTES_EDITOR_STYLE_ID);

      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const updateContent = () => {
    const nextContent = editorRef.current?.innerHTML || '';
    setContent(nextContent);
    setHistoryState((currentHistoryState) =>
      pushNotesHistoryEntry(currentHistoryState, nextContent)
    );
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const decorateEditorLinks = () => {
    editorRef.current?.querySelectorAll('a[href]').forEach((anchor) => {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    });
  };

  const getEditorSelectionRange = () => {
    const editorElement = editorRef.current;
    const selection = window.getSelection();

    if (!editorElement || !selection || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);

    if (!editorElement.contains(range.commonAncestorContainer)) {
      return null;
    }

    return range.cloneRange();
  };

  const restoreEditorSelection = (range: Range | null) => {
    if (!range) {
      return;
    }

    const selection = window.getSelection();

    if (!selection) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(range);
  };

  const moveCursorToEnd = () => {
    if (
      !editorRef.current ||
      typeof window === 'undefined' ||
      !window.getSelection
    ) {
      return;
    }

    const editor = editorRef.current;
    editor.focus();

    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const applyLink = () => {
    const selectionRange = getEditorSelectionRange();
    const selectedText = selectionRange?.toString().trim() || '';
    const rawUrl = window.prompt('Pega la URL del enlace', '');

    if (rawUrl === null) {
      editorRef.current?.focus();
      return;
    }

    const normalizedUrl = normalizeNoteLinkUrl(rawUrl);

    if (!normalizedUrl) {
      editorRef.current?.focus();
      return;
    }

    editorRef.current?.focus();
    restoreEditorSelection(selectionRange);

    if (selectionRange && !selectionRange.collapsed) {
      document.execCommand('createLink', false, normalizedUrl);
      decorateEditorLinks();
    } else {
      document.execCommand(
        'insertHTML',
        false,
        buildNoteLinkHtml(normalizedUrl, selectedText || normalizedUrl)
      );
    }

    updateContent();
  };

  const handleEditorClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const anchor = target.closest('a[href]');

    if (!anchor || !editorRef.current?.contains(anchor)) {
      return;
    }

    const href = anchor.getAttribute('href');
    const normalizedUrl = href ? normalizeNoteLinkUrl(href) : null;

    if (!normalizedUrl) {
      return;
    }

    event.preventDefault();
    window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
  };

  const applyHeading = (level: string) => {
    execCommand('formatBlock', level === 'Normal' ? 'div' : level.toLowerCase());
  };

  const applyList = (type: 'ol' | 'ul') => {
    execCommand(type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList');
  };

  const syncHistoryContent = (nextHistoryState: NotesHistoryState) => {
    const nextContent = nextHistoryState.history[nextHistoryState.index] || '';

    if (editorRef.current) {
      editorRef.current.innerHTML = nextContent;
    }

    setContent(nextContent);
    setHistoryState(nextHistoryState);
  };

  const undo = () => {
    syncHistoryContent(stepNotesHistory(historyState, 'undo'));
  };

  const redo = () => {
    syncHistoryContent(stepNotesHistory(historyState, 'redo'));
  };

  const addTag = () => {
    const nextTags = addUniqueNoteTag(tags, tagInput);

    if (nextTags !== tags) {
      setTags(nextTags);
      setTagInput('');
    }
  };

  const removeExistingTag = (tagToRemove: string) => {
    setTags((currentTags) => removeNoteTag(currentTags, tagToRemove));
  };

  // Cierre puro: nunca depende del resultado de un guardado, de modo que el
  // usuario jamás quede atrapado en el modal.
  const close = () => {
    onClose();
  };

  // Persiste la nota (crear/actualizar) SIN cerrar. Serializa los guardados para
  // evitar duplicados y actualiza `liveNoteIdRef` con el id devuelto para que el
  // siguiente guardado actualice la misma nota.
  const persist = async (silent: boolean): Promise<boolean> => {
    // Nada que guardar: se considera "ok" (no hay pérdida de datos posible).
    if (!hasNoteContent(content)) {
      return true;
    }

    const noteDraft: NoteDraft = {
      chatProvenance: initialNote?.chatProvenance,
      content: content.trim(),
      sourceType: initialNote?.sourceType,
      tags,
      title: title.trim(),
    };

    // Respaldo para consumidores que no proveen autoguardado: usa onSave
    // (que gestiona su propio cierre). No hay seguimiento de id continuo.
    if (!onPersist) {
      setIsSaving(true);
      try {
        return await onSave(noteDraft);
      } finally {
        setIsSaving(false);
      }
    }

    // Nada cambió desde el último guardado: no reescribimos (evita writes
    // redundantes y el guardado "fantasma" al abrir).
    const snapshot = serializeNoteSnapshot(noteDraft.title, noteDraft.content, noteDraft.tags);
    if (snapshot === lastSavedSnapshotRef.current && liveNoteIdRef.current) {
      return true;
    }

    // Espera a que termine un guardado en curso antes de lanzar el siguiente.
    if (inflightSaveRef.current) {
      try {
        await inflightSaveRef.current;
      } catch {
        // El guardado previo ya reportó su error; continuamos con este intento.
      }
    }

    if (!silent) {
      setIsSaving(true);
    }

    setSaveStatus('saving');
    const run = (async () => {
      const savedId = await onPersist(noteDraft, liveNoteIdRef.current, { silent });
      if (savedId) {
        liveNoteIdRef.current = savedId;
        lastSavedSnapshotRef.current = snapshot;
        setSaveStatus('saved');
        return true;
      }
      setSaveStatus('error');
      return false;
    })();

    inflightSaveRef.current = run;

    try {
      return await run;
    } finally {
      if (inflightSaveRef.current === run) {
        inflightSaveRef.current = null;
      }
      if (!silent) {
        setIsSaving(false);
      }
    }
  };

  // Guardado explícito (botón "Guardar" / Ctrl+S) sin cerrar el modal.
  const saveNote = async (): Promise<boolean> => persist(false);

  // Acción de cierre con autoguardado (X, clic fuera, botón "Guardar y cerrar"):
  // intenta persistir y SIEMPRE cierra, evitando el bloqueo ante fallos.
  const saveAndClose = async () => {
    await persist(false);
    close();
  };

  // Autoguardado con debounce mientras se escribe: protege contra la pérdida de
  // la nota si se recarga la página sin cerrar el modal. Es silencioso (no
  // muestra toasts de error) y solo se activa cuando hay persistencia con
  // seguimiento de id (`onPersist`).
  const tagsKey = tags.join('');
  useEffect(() => {
    if (!isOpen || !onPersist || !hasNoteContent(content)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void persist(true);
    }, 1500);

    return () => window.clearTimeout(timeoutId);
    // `persist` se recrea en cada render con los valores actuales; las
    // dependencias primitivas garantizan que el debounce capture lo último.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, onPersist, content, title, tagsKey]);

  // Defensa adicional ante recarga/cierre de pestaña en mitad del debounce:
  // intenta un último guardado (mejor esfuerzo) y, si hay cambios sin guardar,
  // pide confirmación al navegador para no perder la nota.
  useEffect(() => {
    if (!isOpen || !onPersist) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const snapshot = serializeNoteSnapshot(title, content, tags);
      const hasUnsavedChanges =
        hasNoteContent(content) && snapshot !== lastSavedSnapshotRef.current;

      if (!hasUnsavedChanges) {
        return;
      }

      void persist(true);
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, onPersist, content, title, tagsKey]);

  const handleShortcutKeyDown = (event: React.KeyboardEvent) => {
    const shortcutAction = getNoteShortcutAction(event);

    if (!shortcutAction) {
      return;
    }

    event.preventDefault();

    switch (shortcutAction) {
      case 'bold':
        execCommand('bold');
        break;
      case 'italic':
        execCommand('italic');
        break;
      case 'redo':
        redo();
        break;
      case 'save':
        void saveNote();
        break;
      case 'underline':
        execCommand('underline');
        break;
      case 'undo':
        undo();
        break;
    }
  };

  return {
    addTag,
    applyHeading,
    applyLink,
    applyList,
    canRedo: historyState.canRedo,
    canUndo: historyState.canUndo,
    close,
    content,
    editorRef,
    execCommand,
    handleEditorClick,
    saveAndClose,
    saveNote,
    handleShortcutKeyDown,
    hasContent: hasNoteContent(content),
    isSaving,
    saveStatus,
    redo,
    removeTag: removeExistingTag,
    setTagInput,
    setTitle,
    tagInput,
    tags,
    title,
    undo,
    updateContent,
  };
}
