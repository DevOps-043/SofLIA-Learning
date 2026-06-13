'use client'

import type { Editor } from '@tiptap/react'
import { useTranslation } from 'react-i18next'
import { ALargeSmall, StretchVertical, Type } from 'lucide-react'

import { ToolbarDropdown, type ToolbarDropdownOption } from './ToolbarDropdown'

interface FontControlsProps {
  editor: Editor
}

const FONT_FAMILIES = [
  { label: 'Sans', value: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { label: 'Serif', value: 'Georgia, Cambria, "Times New Roman", serif' },
  { label: 'Mono', value: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
]

const FONT_SIZES = ['12px', '14px', '16px', '18px', '24px', '30px']

const LINE_HEIGHTS = ['1', '1.15', '1.5', '2']

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
