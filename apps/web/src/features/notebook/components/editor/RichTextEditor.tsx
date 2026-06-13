'use client'

import { useEffect, type ReactNode } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import {
  Color,
  FontFamily,
  FontSize,
  LineHeight,
  TextStyle,
} from '@tiptap/extension-text-style'

import { cn } from '@/utils/cn'
import { EditorToolbar } from './EditorToolbar'

interface RichTextEditorProps {
  /** Current HTML value. */
  value: string
  /** Emits sanitized-on-save HTML on every change. */
  onChange: (html: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
  /** Node rendered inside the page sheet, above the content (e.g. the title). */
  header?: ReactNode
  /** Styles for the page "sheet" wrapper (padding etc.). */
  pageClassName?: string
}

/**
 * Reusable TipTap (ProseMirror) rich-text editor with a Word-like layout: a
 * floating "ribbon" toolbar that sticks while scrolling and a paper "sheet"
 * holding the optional header (title) and the document content. Stores/emits
 * HTML for compatibility with the existing `note_content` format.
 * `immediatelyRender` is disabled for Next.js SSR safety.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  editable = true,
  className,
  header,
  pageClassName,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            rel: 'noopener noreferrer nofollow',
            target: '_blank',
          },
        },
      }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      LineHeight.configure({ types: ['paragraph', 'heading'] }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
    ],
    content: value,
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'notebook-prose min-h-[72vh] focus:outline-none',
      },
    },
  })

  // Sync external value changes (e.g. note loaded after mount) without looping.
  useEffect(() => {
    if (!editor) return
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  // Keep editable state in sync.
  useEffect(() => {
    editor?.setEditable(editable)
  }, [editable, editor])

  return (
    <div className={cn('flex flex-col', className)}>
      {editable && (
        <div className="sticky top-4 z-20 mb-4">
          <EditorToolbar editor={editor} />
        </div>
      )}
      <div
        className={cn(
          'rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-xl dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-100',
          pageClassName,
        )}
      >
        {header}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
