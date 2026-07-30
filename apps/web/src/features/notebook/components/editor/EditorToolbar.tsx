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
import styles from '../NotebookEditor.module.css'

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
        styles.toolbarButton,
        isActive && styles.toolbarButtonActive,
      )}
    >
      <Icon />
    </button>
  )
}

function ToolbarDivider() {
  return <span className={styles.toolbarDivider} />
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
    <div className={styles.toolbar}>
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
        <div className={styles.linkPopover}>
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
            className={styles.linkInput}
          />
          <button
            type="button"
            onClick={applyLink}
            className={styles.linkApply}
          >
            {t('editor.toolbar.applyLink')}
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className={styles.linkCancel}
          >
            {t('editor.toolbar.cancelLink')}
          </button>
        </div>
      )}
    </div>
  )
}
