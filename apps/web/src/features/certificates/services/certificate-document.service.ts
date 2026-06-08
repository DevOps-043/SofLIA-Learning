import { getFullUrl } from '@/lib/env'
import type { Json } from '@/lib/supabase/types'
import { DEFAULT_CERTIFICATE_VISUAL_TOKENS, SOFLIA_PLATFORM_BRAND } from '@/features/certificates/constants/certificate-branding'
import type {
  CertificateBrandingSnapshot,
  CertificateDocumentModel,
  CertificateDocumentSnapshot,
  CertificateVisualTokens,
} from '@/features/certificates/types/certificate'

interface CertificateTemplateColors {
  primary: string | null
  secondary: string | null
  text: string | null
  background: string | null
}

export interface BuildCertificateSnapshotsInput {
  organizationId: string | null
  organizationName: string | null
  organizationLogoUrl: string | null
  organizationPrimaryColor: string | null
  organizationAccentColor: string | null
  organizationSecondaryColor: string | null
  templateId: string | null
  templateDesignConfig: Json | null
  learnerName: string
  courseTitle: string
  instructorName: string
  instructorSignatureUrl: string | null
  instructorSignatureName: string | null
  issuedAt: string
}

interface RecordValue {
  [key: string]: Json | undefined
}

function isRecord(value: Json | null | undefined): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(record: RecordValue, key: string): string | null {
  const value = record[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function readBoolean(record: RecordValue, key: string): boolean | null {
  const value = record[key]
  return typeof value === 'boolean' ? value : null
}

function normalizeAssetUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null
  }

  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }

  if (url.startsWith('/')) {
    return getFullUrl(url)
  }

  return url
}

// Caracteres que NO deben aparecer en el texto de un certificado y que, si se
// arrastran desde SSO/importaciones, se renderizan como artefactos visibles
// (p. ej. una raya bajo el nombre). Cubre: controles C0/C1, invisibles de ancho
// cero, y marcas combinantes DECORATIVAS (subrayado U+0332, doble subrayado,
// tachados/overlays). NO incluye marcas de acento (á, í, ñ, ü…), que se conservan.
const DECORATIVE_TEXT_ARTIFACTS =
  /[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF\u0332\u0333\u0336\u0337\u0338]/g

function normalizeText(value: string | null | undefined, fallback: string): string {
  // `normalize('NFC')` compone los acentos descompuestos (base + combinante) en un
  // unico glifo precompuesto, que html2canvas renderiza de forma mas fiable.
  const normalized = value
    ?.replace(DECORATIVE_TEXT_ARTIFACTS, '')
    .normalize('NFC')
    .trim()
  return normalized && normalized.length > 0 ? normalized : fallback
}

function extractTemplateColors(templateDesignConfig: Json | null): CertificateTemplateColors {
  if (!isRecord(templateDesignConfig)) {
    return {
      primary: null,
      secondary: null,
      text: null,
      background: null,
    }
  }

  const colors = templateDesignConfig.colors
  if (!isRecord(colors)) {
    return {
      primary: null,
      secondary: null,
      text: null,
      background: null,
    }
  }

  return {
    primary: readString(colors, 'primary'),
    secondary: readString(colors, 'secondary'),
    text: readString(colors, 'text'),
    background: readString(colors, 'background'),
  }
}

function buildVisualTokens(input: BuildCertificateSnapshotsInput): CertificateVisualTokens {
  const templateColors = extractTemplateColors(input.templateDesignConfig)

  return {
    primaryColor:
      templateColors.primary ||
      input.organizationPrimaryColor ||
      DEFAULT_CERTIFICATE_VISUAL_TOKENS.primaryColor,
    accentColor:
      templateColors.secondary ||
      input.organizationAccentColor ||
      DEFAULT_CERTIFICATE_VISUAL_TOKENS.accentColor,
    borderColor:
      input.organizationSecondaryColor ||
      DEFAULT_CERTIFICATE_VISUAL_TOKENS.borderColor,
    backgroundColor:
      templateColors.background ||
      DEFAULT_CERTIFICATE_VISUAL_TOKENS.backgroundColor,
    textColor:
      templateColors.text ||
      DEFAULT_CERTIFICATE_VISUAL_TOKENS.textColor,
    mutedColor: DEFAULT_CERTIFICATE_VISUAL_TOKENS.mutedColor,
  }
}

export function buildCertificateFileName(courseTitle: string): string {
  const sanitizedTitle = normalizeText(courseTitle, 'certificado')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return `${sanitizedTitle || 'certificado'}_certificado.pdf`
}

export function buildCertificateSnapshots(
  input: BuildCertificateSnapshotsInput,
): {
  brandingSnapshot: CertificateBrandingSnapshot
  documentSnapshot: CertificateDocumentSnapshot
} {
  const issuerName = normalizeText(input.organizationName, SOFLIA_PLATFORM_BRAND.name)

  const brandingSnapshot: CertificateBrandingSnapshot = {
    platform: {
      ...SOFLIA_PLATFORM_BRAND,
      logoUrl: normalizeAssetUrl(SOFLIA_PLATFORM_BRAND.logoUrl) || SOFLIA_PLATFORM_BRAND.logoUrl,
    },
    issuer: {
      organizationId: input.organizationId,
      name: issuerName,
      logoUrl: normalizeAssetUrl(input.organizationLogoUrl),
    },
    visualTokens: buildVisualTokens(input),
    legacyMode: !input.organizationId,
  }

  const documentSnapshot: CertificateDocumentSnapshot = {
    learnerName: normalizeText(input.learnerName, 'Estudiante'),
    courseTitle: normalizeText(input.courseTitle, 'Curso sin título'),
    instructorName: normalizeText(input.instructorName, 'Instructor'),
    instructorSignatureUrl: normalizeAssetUrl(input.instructorSignatureUrl),
    instructorSignatureName: normalizeText(input.instructorSignatureName, ''),
    issuedAt: input.issuedAt,
    programText: `Forma parte del programa de capacitación de ${issuerName}`,
  }

  return {
    brandingSnapshot,
    documentSnapshot,
  }
}

export function parseCertificateBrandingSnapshot(
  value: Json | null | undefined,
): CertificateBrandingSnapshot | null {
  if (!isRecord(value)) {
    return null
  }

  const platform = isRecord(value.platform) ? value.platform : null
  const issuer = isRecord(value.issuer) ? value.issuer : null
  const visualTokens = isRecord(value.visualTokens) ? value.visualTokens : null

  if (!platform || !issuer || !visualTokens) {
    return null
  }

  const platformName = normalizeText(readString(platform, 'name'), '')
  const platformLogoUrl = normalizeAssetUrl(readString(platform, 'logoUrl'))
  const issuerName = normalizeText(readString(issuer, 'name'), '')
  const primaryColor = readString(visualTokens, 'primaryColor')
  const accentColor = readString(visualTokens, 'accentColor')
  const borderColor = readString(visualTokens, 'borderColor')
  const backgroundColor = readString(visualTokens, 'backgroundColor')
  const textColor = readString(visualTokens, 'textColor')
  const mutedColor = readString(visualTokens, 'mutedColor')

  if (
    !platformName ||
    !platformLogoUrl ||
    !issuerName ||
    !primaryColor ||
    !accentColor ||
    !borderColor ||
    !backgroundColor ||
    !textColor ||
    !mutedColor
  ) {
    return null
  }

  return {
    platform: {
      name: platformName,
      logoUrl: platformLogoUrl,
    },
    issuer: {
      organizationId: readString(issuer, 'organizationId'),
      name: issuerName,
      logoUrl: normalizeAssetUrl(readString(issuer, 'logoUrl')),
    },
    visualTokens: {
      primaryColor,
      accentColor,
      borderColor,
      backgroundColor,
      textColor,
      mutedColor,
    },
    legacyMode: readBoolean(value, 'legacyMode') ?? false,
  }
}

export function parseCertificateDocumentSnapshot(
  value: Json | null | undefined,
): CertificateDocumentSnapshot | null {
  if (!isRecord(value)) {
    return null
  }

  const learnerName = normalizeText(readString(value, 'learnerName'), '')
  const courseTitle = normalizeText(readString(value, 'courseTitle'), '')
  const instructorName = normalizeText(readString(value, 'instructorName'), '')
  const issuedAt = normalizeText(readString(value, 'issuedAt'), '')
  const programText = normalizeText(readString(value, 'programText'), '')

  if (!learnerName || !courseTitle || !instructorName || !issuedAt || !programText) {
    return null
  }

  return {
    learnerName,
    courseTitle,
    instructorName,
    instructorSignatureUrl: normalizeAssetUrl(readString(value, 'instructorSignatureUrl')),
    instructorSignatureName: normalizeText(readString(value, 'instructorSignatureName'), ''),
    issuedAt,
    programText,
  }
}

export function shouldRebuildSnapshots(
  brandingSnapshot: CertificateBrandingSnapshot | null,
  documentSnapshot: CertificateDocumentSnapshot | null,
): boolean {
  if (!brandingSnapshot || !documentSnapshot) {
    return true
  }

  if (brandingSnapshot.platform.name !== SOFLIA_PLATFORM_BRAND.name) {
    return true
  }

  return !documentSnapshot.programText.includes('programa de capacitación de')
}

export function toCertificateJson(
  value: CertificateBrandingSnapshot | CertificateDocumentSnapshot,
): Json {
  return value as unknown as Json
}

export function buildCertificateDocumentModel(input: {
  certificateId: string
  certificateHash: string
  certificateUrl: string | null
  issuedAt: string
  expiresAt: string | null
  courseId: string | null
  courseSlug: string | null
  enrollmentId: string | null
  brandingSnapshot: CertificateBrandingSnapshot
  documentSnapshot: CertificateDocumentSnapshot
}): CertificateDocumentModel {
  return {
    certificateId: input.certificateId,
    certificateHash: input.certificateHash,
    certificateUrl: input.certificateUrl,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
    verificationUrl: getFullUrl(`/certificates/verify/${input.certificateHash}`),
    fileName: buildCertificateFileName(input.documentSnapshot.courseTitle),
    courseId: input.courseId,
    courseSlug: input.courseSlug,
    enrollmentId: input.enrollmentId,
    branding: input.brandingSnapshot,
    document: input.documentSnapshot,
  }
}
