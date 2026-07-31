'use client'

import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import {
  Check,
  ChevronDown,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react'

import styles from './PremiumFormControls.module.css'
import {
  getPremiumControlStyle,
  type PremiumControlPalette,
  type PremiumSelectOption,
} from './types'
import { useAnchoredPopover } from './useAnchoredPopover'

interface PremiumSelectProps {
  ariaLabel: string
  disabled?: boolean
  icon?: LucideIcon
  id?: string
  onChange: (value: string) => void
  options: PremiumSelectOption[]
  palette: PremiumControlPalette
  placeholder: string
  value: string
}

export function PremiumSelect({
  ariaLabel,
  disabled = false,
  icon: LeadingIcon = SlidersHorizontal,
  id,
  onChange,
  options,
  palette,
  placeholder,
  value,
}: PremiumSelectProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const selectedIndex = options.findIndex((option) => option.value === value)
  const [activeIndex, setActiveIndex] = useState(
    selectedIndex >= 0 ? selectedIndex : 0,
  )
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  )
  const controlStyle = getPremiumControlStyle(palette)
  const { position, updatePosition } = useAnchoredPopover({
    isOpen,
    minimumWidth: 220,
    popoverRef,
    preferredHeight: Math.min(320, options.length * 48 + 16),
    triggerRef,
  })

  useEffect(() => {
    if (!isOpen) return
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    const focusFrame = window.requestAnimationFrame(() =>
      popoverRef.current?.focus(),
    )

    const handlePointerDown = (event: MouseEvent) => {
      const node = event.target as Node
      if (
        !triggerRef.current?.contains(node) &&
        !popoverRef.current?.contains(node)
      ) {
        setIsOpen(false)
      }
    }
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, selectedIndex])

  function selectOption(index: number) {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    setIsOpen(false)
    window.requestAnimationFrame(() => triggerRef.current?.focus())
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsOpen(true)
    }
  }

  function handleListKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % options.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => (current - 1 + options.length) % options.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(options.length - 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectOption(activeIndex)
    }
  }

  const listboxId = `${id ?? 'premium-select'}-listbox`

  return (
    <div className={styles.controlRoot} style={controlStyle}>
      <button
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        disabled={disabled}
        id={id}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span className={styles.leadingIcon}>
          <LeadingIcon aria-hidden="true" />
        </span>
        <span
          className={
            selectedOption ? styles.triggerValue : styles.triggerPlaceholder
          }
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <span
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
        >
          <ChevronDown aria-hidden="true" />
        </span>
      </button>

      {isOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              aria-label={ariaLabel}
              className={styles.popover}
              id={listboxId}
              onAnimationEnd={updatePosition}
              onKeyDown={handleListKeyDown}
              ref={popoverRef}
              role="listbox"
              style={{
                ...controlStyle,
                left: position?.left ?? -9999,
                maxHeight: position?.maxHeight ?? 320,
                top: position?.top ?? -9999,
                width: position?.width ?? 240,
              }}
              tabIndex={-1}
            >
              {options.map((option, index) => {
                const isSelected = option.value === value
                const isActive = index === activeIndex
                return (
                  <button
                    aria-selected={isSelected}
                    className={`${styles.option} ${
                      isSelected ? styles.optionSelected : ''
                    } ${isActive ? styles.optionActive : ''}`}
                    key={option.value || '__empty'}
                    onClick={() => selectOption(index)}
                    onMouseEnter={() => setActiveIndex(index)}
                    role="option"
                    type="button"
                  >
                    <span className={styles.optionCopy}>
                      <span className={styles.optionLabel}>{option.label}</span>
                      {option.description ? (
                        <span className={styles.optionDescription}>
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                    {isSelected ? (
                      <span className={styles.optionCheck}>
                        <Check aria-hidden="true" />
                      </span>
                    ) : (
                      <span aria-hidden="true" />
                    )}
                  </button>
                )
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
