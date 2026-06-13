'use client'

import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { NOTEBOOK_MAX_TAGS } from '../types'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const { t } = useTranslation('notebook')
  const [draft, setDraft] = useState('')

  const addTag = () => {
    const value = draft.trim()
    if (!value) return
    if (tags.includes(value) || tags.length >= NOTEBOOK_MAX_TAGS) {
      setDraft('')
      return
    }
    onChange([...tags, value])
    setDraft('')
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter((existing) => existing !== tag))
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag()
    } else if (event.key === 'Backspace' && !draft && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-200"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-gray-400 hover:text-[var(--color-error)]"
            aria-label={t('editor.removeTag', { tag })}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {tags.length < NOTEBOOK_MAX_TAGS && (
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={t('editor.tagPlaceholder')}
          maxLength={64}
          className="h-7 min-w-[120px] flex-1 bg-transparent text-xs text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
        />
      )}
    </div>
  )
}
