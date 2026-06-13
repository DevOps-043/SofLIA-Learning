'use client'

import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { useTranslation } from 'react-i18next'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  Link2Off,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  SquareCode,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Underline as UnderlineIcon,
  Undo2,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/utils/cn'
import { ColorMenu } from './ColorMenu'
import { FontControls } from './FontControls'

interface EditorToolbarProps {
  editor: Editor | null
}

function ToolbarButton({
  icon: Icon,
  label,
  isActive,
  disabled,
  onClick,
}: {
  icon: LucideIcon
  label: string
  isActive?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-white/10',
        isActive &&
          'bg-[var(--color-accent)]/15 text-[var(--color-primary)] dark:text-[var(--color-accent)]',
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

function ToolbarDivider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-gray-200 dark:bg-white/10" />
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const { t } = useTranslation('notebook')
  const [linkValue, setLinkValue] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)

  if (!editor) return null

  const openLinkInput = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined
    setLinkValue(previousUrl ?? 'https://')
    setShowLinkInput(true)
  }

  const applyLink = () => {
    const url = linkValue.trim()
    if (!url || url === 'https://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run()
    }
    setShowLinkInput(false)
    setLinkValue('')
  }

  return (
    <div className="relative flex flex-wrap items-center gap-0.5 rounded-xl border border-gray-200 bg-white px-2 py-1.5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <ToolbarButton
        icon={Bold}
        label={t('editor.toolbar.bold')}
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={Italic}
        label={t('editor.toolbar.italic')}
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={UnderlineIcon}
        label={t('editor.toolbar.underline')}
        isActive={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        icon={Strikethrough}
        label={t('editor.toolbar.strike')}
        isActive={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolbarButton
        icon={SubscriptIcon}
        label={t('editor.toolbar.subscript')}
        isActive={editor.isActive('subscript')}
        onClick={() => editor.chain().focus().toggleSubscript().run()}
      />
      <ToolbarButton
        icon={SuperscriptIcon}
        label={t('editor.toolbar.superscript')}
        isActive={editor.isActive('superscript')}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
      />

      <ToolbarDivider />

      <FontControls editor={editor} />
      <ColorMenu editor={editor} mode="text" />
      <ColorMenu editor={editor} mode="highlight" />

      <ToolbarDivider />

      <ToolbarButton
        icon={Heading1}
        label={t('editor.toolbar.heading1')}
        isActive={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        icon={Heading2}
        label={t('editor.toolbar.heading2')}
        isActive={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        icon={Heading3}
        label={t('editor.toolbar.heading3')}
        isActive={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />

      <ToolbarDivider />

      <ToolbarButton
        icon={List}
        label={t('editor.toolbar.bulletList')}
        isActive={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={ListOrdered}
        label={t('editor.toolbar.orderedList')}
        isActive={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        icon={ListChecks}
        label={t('editor.toolbar.taskList')}
        isActive={editor.isActive('taskList')}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      />
      <ToolbarButton
        icon={Quote}
        label={t('editor.toolbar.blockquote')}
        isActive={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        icon={Code}
        label={t('editor.toolbar.inlineCode')}
        isActive={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <ToolbarButton
        icon={SquareCode}
        label={t('editor.toolbar.code')}
        isActive={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />
      <ToolbarButton
        icon={Minus}
        label={t('editor.toolbar.horizontalRule')}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />

      <ToolbarDivider />

      <ToolbarButton
        icon={AlignLeft}
        label={t('editor.toolbar.alignLeft')}
        isActive={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      />
      <ToolbarButton
        icon={AlignCenter}
        label={t('editor.toolbar.alignCenter')}
        isActive={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      />
      <ToolbarButton
        icon={AlignRight}
        label={t('editor.toolbar.alignRight')}
        isActive={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      />

      <ToolbarDivider />

      <ToolbarButton
        icon={Link2}
        label={t('editor.toolbar.link')}
        isActive={editor.isActive('link')}
        onClick={openLinkInput}
      />
      <ToolbarButton
        icon={Link2Off}
        label={t('editor.toolbar.unlink')}
        disabled={!editor.isActive('link')}
        onClick={() => editor.chain().focus().unsetLink().run()}
      />
      <ToolbarButton
        icon={RemoveFormatting}
        label={t('editor.toolbar.clearFormat')}
        onClick={() =>
          editor.chain().focus().unsetAllMarks().clearNodes().run()
        }
      />

      <ToolbarDivider />

      <ToolbarButton
        icon={Undo2}
        label={t('editor.toolbar.undo')}
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        icon={Redo2}
        label={t('editor.toolbar.redo')}
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      />

      {showLinkInput && (
        <div className="absolute left-2 top-full z-20 mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-[var(--color-gray-800)]">
          <input
            autoFocus
            type="url"
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                applyLink()
              } else if (event.key === 'Escape') {
                setShowLinkInput(false)
              }
            }}
            placeholder="https://"
            className="h-8 w-56 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-900 outline-none focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          <button
            type="button"
            onClick={applyLink}
            className="h-8 rounded-md bg-[var(--color-primary)] px-3 text-xs font-semibold text-white hover:opacity-90"
          >
            {t('editor.toolbar.applyLink')}
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className="h-8 rounded-md px-2 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
          >
            {t('editor.toolbar.cancelLink')}
          </button>
        </div>
      )}
    </div>
  )
}
