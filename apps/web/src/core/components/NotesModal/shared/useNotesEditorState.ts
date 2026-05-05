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

interface UseNotesEditorStateResult {
  addTag: () => void;
  applyHeading: (level: string) => void;
  applyLink: () => void;
  applyList: (type: 'ol' | 'ul') => void;
  canRedo: boolean;
  canUndo: boolean;
  content: string;
  editorRef: React.RefObject<HTMLDivElement>;
  execCommand: (command: string, value?: string) => void;
  handleSave: () => Promise<void>;
  handleEditorClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleShortcutKeyDown: (event: React.KeyboardEvent) => void;
  hasContent: boolean;
  isSaving: boolean;
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
}: Pick<NotesModalProps, 'initialNote' | 'isOpen' | 'onClose' | 'onSave'>): UseNotesEditorStateResult {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [historyState, setHistoryState] = useState<NotesHistoryState>(
    createNotesHistoryState()
  );

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setContent('');
      setTags([]);
      setTagInput('');
      setIsSaving(false);
      setHistoryState(createNotesHistoryState());

      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }

      return;
    }

    const nextContent = initialNote?.content || '';
    setTitle(initialNote?.title || '');
    setContent(nextContent);
    setTags(initialNote?.tags || []);
    setTagInput('');
    setIsSaving(false);
    setHistoryState(createNotesHistoryState(nextContent));

    if (editorRef.current) {
      editorRef.current.innerHTML = nextContent;

      if (initialNote) {
        requestAnimationFrame(() => {
          moveCursorToEnd();
        });
      }
    }
  }, [initialNote, isOpen]);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    if (editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

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

  const handleSave = async () => {
    if (!hasNoteContent(content)) {
      onClose();
      return;
    }

    setIsSaving(true);

    try {
      const noteDraft: NoteDraft = {
        content: content.trim(),
        tags,
        title: title.trim(),
      };

      const wasSaved = await onSave(noteDraft);

      if (wasSaved) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

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
        void handleSave();
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
    content,
    editorRef,
    execCommand,
    handleEditorClick,
    handleSave,
    handleShortcutKeyDown,
    hasContent: hasNoteContent(content),
    isSaving,
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
