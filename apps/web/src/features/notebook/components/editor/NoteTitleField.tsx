'use client'

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

interface NoteTitleFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  className?: string
  ariaLabel?: string
}

/** Un título es una sola línea lógica: los saltos de línea se colapsan. */
function collapseLineBreaks(value: string): string {
  return value.replace(/[\r\n]+/g, ' ')
}

/**
 * Campo de título del apunte.
 *
 * Es un `<textarea>` de una sola línea lógica en lugar de un `<input>` porque un
 * input no ajusta el texto: los títulos largos se desbordaban y quedaban
 * recortados contra el borde de la hoja (que tiene `overflow: hidden`). Aquí el
 * texto fluye en varias líneas y la altura se sincroniza con el contenido,
 * también cuando cambia el ancho disponible (resize o cambio de breakpoint).
 */
export function NoteTitleField({
  value,
  onChange,
  placeholder,
  maxLength = 256,
  className,
  ariaLabel,
}: NoteTitleFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const syncHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    // Se colapsa primero para que scrollHeight refleje el alto real del
    // contenido y el campo pueda encogerse al borrar texto, no solo crecer.
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [])

  // Antes del paint, para que no se vea un salto de altura al cargar la nota.
  useLayoutEffect(() => {
    syncHeight()
  }, [syncHeight, value])

  // Al cambiar el ancho, el texto se reajusta y puede ganar o perder líneas.
  useEffect(() => {
    const handleResize = () => syncHeight()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [syncHeight])

  return (
    <textarea
      ref={textareaRef}
      value={value}
      rows={1}
      maxLength={maxLength}
      spellCheck={false}
      aria-label={ariaLabel}
      placeholder={placeholder}
      className={className}
      onChange={(event) => onChange(collapseLineBreaks(event.target.value))}
      onKeyDown={(event) => {
        // El título ajusta solo: Enter no debe insertar un salto de línea.
        if (event.key === 'Enter') event.preventDefault()
      }}
    />
  )
}
