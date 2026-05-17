import type { CSSProperties } from 'react'
import type { CertificateDocumentModel } from '@/features/certificates/types/certificate'
import type { CertificateDocumentColors } from './types'

export function formatCertificateDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateString
  }
}

export function colorWithAlpha(color: string, alpha: number, fallback: string): string {
  const normalized = color.trim()
  const hexMatch = normalized.match(/^#([0-9a-f]{6})$/i)
  if (!hexMatch) return fallback
  const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0')
  return normalized + alphaHex
}

export function buildFrameStyle(input: {
  width: string
  height: string
  borderColor: string
  backgroundColor: string
  padding: string
}): CSSProperties {
  return { width: input.width, height: input.height, borderRadius: '14px', border: '1px solid ' + input.borderColor, background: input.backgroundColor, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: input.padding }
}

export function buildDocumentColors(model: CertificateDocumentModel): CertificateDocumentColors {
  const { accentColor, primaryColor } = model.branding.visualTokens
  return {
    surfaceColor: 'rgb(255,255,255)',
    softSurfaceColor: 'rgba(255,255,255,0.88)',
    primarySoft: colorWithAlpha(primaryColor, 0.1, 'rgba(10,37,64,0.1)'),
    primaryLine: colorWithAlpha(primaryColor, 0.18, 'rgba(10,37,64,0.18)'),
    accentSoft: colorWithAlpha(accentColor, 0.13, 'rgba(0,212,179,0.13)'),
    accentLine: colorWithAlpha(accentColor, 0.35, 'rgba(0,212,179,0.35)'),
  }
}
