import type { CSSProperties } from 'react'

export function formatCertificateDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

export function colorWithAlpha(color: string, alpha: number, fallback: string): string {
  const normalized = color.trim()
  const hexMatch = normalized.match(/^#([0-9a-f]{6})$/i)
  if (!hexMatch) return fallback

  const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0')
  return `${normalized}${alphaHex}`
}

export function buildFrameStyle(input: {
  width: string
  height: string
  borderColor: string
  backgroundColor: string
  padding: string
}): CSSProperties {
  return {
    width: input.width,
    height: input.height,
    borderRadius: '14px',
    border: `1px solid ${input.borderColor}`,
    background: input.backgroundColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: input.padding,
  }
}
