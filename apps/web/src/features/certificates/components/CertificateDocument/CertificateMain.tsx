import type { CertificateDocumentModel } from '@/features/certificates/types/certificate'

function resolveTextSize(text: string, sizes: Array<[number, number]>, fallback: number): string {
  const length = Array.from(text.trim()).length
  const matchedSize = sizes.find(([minLength]) => length >= minLength)?.[1] ?? fallback
  return `${matchedSize}px`
}

export function CertificateMain({ model }: { model: CertificateDocumentModel }) {
  const { accentColor, borderColor, mutedColor, primaryColor, textColor } = model.branding.visualTokens
  const learnerNameFontSize = resolveTextSize(
    model.document.learnerName,
    [
      [90, 30],
      [72, 34],
      [54, 40],
      [38, 46],
    ],
    54,
  )
  const courseTitleFontSize = resolveTextSize(
    model.document.courseTitle,
    [
      [96, 18],
      [72, 21],
      [52, 24],
    ],
    27,
  )

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2px 54px 4px' }}>
      <div style={{ fontSize: '18px', lineHeight: 1.4, color: mutedColor, fontWeight: 600, marginBottom: '10px' }}>El presente certifica que</div>
      <div style={{ maxWidth: '930px', fontSize: learnerNameFontSize, lineHeight: 1.06, letterSpacing: 0, fontWeight: 900, color: primaryColor, marginBottom: '14px', overflowWrap: 'anywhere', wordBreak: 'normal', hyphens: 'auto' }}>{model.document.learnerName}</div>
      <div style={{ width: '112px', height: '4px', borderRadius: '999px', background: 'linear-gradient(90deg, ' + primaryColor + ', ' + accentColor + ')', marginBottom: '18px' }} />
      <div style={{ fontSize: '18px', lineHeight: 1.4, color: mutedColor, fontWeight: 600, marginBottom: '12px' }}>ha completado exitosamente el curso</div>
      <div style={{ maxWidth: '900px', padding: '14px 30px', borderTop: '1px solid ' + borderColor, borderBottom: '1px solid ' + borderColor, fontSize: courseTitleFontSize, lineHeight: 1.24, fontWeight: 850, color: textColor, overflowWrap: 'anywhere', wordBreak: 'normal', hyphens: 'auto' }}>{model.document.courseTitle}</div>
      <div style={{ maxWidth: '760px', marginTop: '14px', fontSize: '15px', lineHeight: 1.45, color: mutedColor, fontWeight: 500 }}>{model.document.programText}</div>
    </main>
  )
}
