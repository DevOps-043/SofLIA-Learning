import type { CertificateSectionProps } from './types'

export function CertificateBody({ model, tokens }: CertificateSectionProps) {
  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2px 54px 4px',
      }}
    >
      <div style={{ fontSize: '18px', lineHeight: 1.4, color: tokens.mutedColor, fontWeight: 600, marginBottom: '10px' }}>
        El presente certifica que
      </div>
      <div
        style={{
          maxWidth: '930px',
          fontSize: '54px',
          lineHeight: 1.04,
          letterSpacing: 0,
          fontWeight: 900,
          color: tokens.primaryColor,
          marginBottom: '14px',
          wordBreak: 'break-word',
        }}
      >
        {model.document.learnerName}
      </div>
      <div style={{ width: '112px', height: '4px', borderRadius: '999px', background: `linear-gradient(90deg, ${tokens.primaryColor}, ${tokens.accentColor})`, marginBottom: '18px' }} />
      <div style={{ fontSize: '18px', lineHeight: 1.4, color: tokens.mutedColor, fontWeight: 600, marginBottom: '12px' }}>
        ha completado exitosamente el curso
      </div>
      <div
        style={{
          maxWidth: '900px',
          padding: '14px 30px',
          borderTop: `1px solid ${tokens.borderColor}`,
          borderBottom: `1px solid ${tokens.borderColor}`,
          fontSize: '27px',
          lineHeight: 1.24,
          fontWeight: 850,
          color: tokens.textColor,
          wordBreak: 'break-word',
        }}
      >
        {model.document.courseTitle}
      </div>
      <div style={{ maxWidth: '760px', marginTop: '14px', fontSize: '15px', lineHeight: 1.45, color: tokens.mutedColor, fontWeight: 500 }}>
        {model.document.programText}
      </div>
    </main>
  )
}
