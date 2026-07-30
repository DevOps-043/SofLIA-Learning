'use client'

import type { Editor } from '@tiptap/react'
import { useTranslation } from 'react-i18next'
import { ALargeSmall, StretchVertical, Type } from 'lucide-react'

import { ToolbarDropdown, type ToolbarDropdownOption } from './ToolbarDropdown'
import styles from '../NotebookEditor.module.css'

interface FontControlsProps {
  editor: Editor
}

const FONT_FAMILIES = [
  { label: 'Sans', value: '"Inter Tight", ui-sans-serif, system-ui, sans-serif' },
  { label: 'Serif', value: 'Georgia, Cambria, "Times New Roman", serif' },
  { label: 'Mono', value: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
]

// Escalera de tamaños (px) estilo Word para el selector y los pasos A−/A+.
const FONT_SIZE_STEPS = [12, 14, 16, 18, 20, 24, 30, 36, 48]
const FONT_SIZES = FONT_SIZE_STEPS.map((size) => `${size}px`)
// Tamaño base del cuerpo (.notebook-prose ≈ 1.0625rem) cuando no hay override.
const BASE_FONT_SIZE = 17

const LINE_HEIGHTS = ['1', '1.15', '1.5', '2']

/** Devuelve el siguiente tamaño de la escalera en la dirección indicada. */
function steppedFontSize(current: number, direction: 1 | -1): string {
  if (direction === 1) {
    const next = FONT_SIZE_STEPS.find((size) => size > current)
    return `${next ?? FONT_SIZE_STEPS[FONT_SIZE_STEPS.length - 1]}px`
  }
  const smaller = [...FONT_SIZE_STEPS].reverse().find((size) => size < current)
  return `${smaller ?? FONT_SIZE_STEPS[0]}px`
}

/** Font family, size and line-height selectors using the Premium Dropdown. */
export function FontControls({ editor }: FontControlsProps) {
  const { t } = useTranslation('notebook')

  const defaultLabel = t('editor.toolbar.default')

  const currentFamily =
    (editor.getAttributes('textStyle').fontFamily as string | undefined) ?? ''
  const currentSize =
    (editor.getAttributes('textStyle').fontSize as string | undefined) ?? ''
  const currentLineHeight =
    (editor.getAttributes('paragraph').lineHeight as string | undefined) ??
    (editor.getAttributes('heading').lineHeight as string | undefined) ??
    ''

  const familyOptions: ToolbarDropdownOption[] = [
    { value: '', label: defaultLabel },
    ...FONT_FAMILIES.map((font) => ({
      value: font.value,
      label: font.label,
      previewStyle: { fontFamily: font.value },
    })),
  ]

  const sizeOptions: ToolbarDropdownOption[] = [
    { value: '', label: defaultLabel },
    ...FONT_SIZES.map((size) => ({
      value: size,
      label: String(parseInt(size, 10)),
    })),
  ]

  const lineHeightOptions: ToolbarDropdownOption[] = [
    { value: '', label: defaultLabel },
    ...LINE_HEIGHTS.map((value) => ({ value, label: value })),
  ]

  const currentSizePx = parseInt(currentSize, 10) || BASE_FONT_SIZE
  const stepFontSize = (direction: 1 | -1) => {
    editor
      .chain()
      .focus()
      .setFontSize(steppedFontSize(currentSizePx, direction))
      .run()
  }

  return (
    <>
      <ToolbarDropdown
        ariaLabel={t('editor.toolbar.fontFamily')}
        placeholder={t('editor.toolbar.fontDefault')}
        icon={Type}
        value={currentFamily}
        options={familyOptions}
        triggerClassName="w-[112px]"
        onSelect={(value) => {
          if (value) editor.chain().focus().setFontFamily(value).run()
          else editor.chain().focus().unsetFontFamily().run()
        }}
      />
      <button
        type="button"
        title={t('editor.toolbar.decreaseFont')}
        aria-label={t('editor.toolbar.decreaseFont')}
        onClick={() => stepFontSize(-1)}
        className={styles.toolbarTypeButton}
      >
        <span className="text-xs font-bold">A−</span>
      </button>
      <ToolbarDropdown
        ariaLabel={t('editor.toolbar.fontSize')}
        icon={ALargeSmall}
        value={currentSize}
        options={sizeOptions}
        triggerClassName="w-[66px]"
        onSelect={(value) => {
          if (value) editor.chain().focus().setFontSize(value).run()
          else editor.chain().focus().unsetFontSize().run()
        }}
      />
      <button
        type="button"
        title={t('editor.toolbar.increaseFont')}
        aria-label={t('editor.toolbar.increaseFont')}
        onClick={() => stepFontSize(1)}
        className={styles.toolbarTypeButton}
      >
        <span className="text-base font-bold">A+</span>
      </button>
      <ToolbarDropdown
        ariaLabel={t('editor.toolbar.lineHeight')}
        icon={StretchVertical}
        value={currentLineHeight}
        options={lineHeightOptions}
        triggerClassName="w-[62px]"
        onSelect={(value) => {
          if (value) editor.chain().focus().setLineHeight(value).run()
          else editor.chain().focus().unsetLineHeight().run()
        }}
      />
    </>
  )
}
