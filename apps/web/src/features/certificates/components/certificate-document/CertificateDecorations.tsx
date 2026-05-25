export function CertificateDecorations({
  accentLine,
  borderColor,
  primaryLine,
  primaryColor,
  accentColor,
}: {
  accentLine: string
  borderColor: string
  primaryLine: string
  primaryColor: string
  accentColor: string
}) {
  return (
    <>
      <div style={{ position: 'absolute', inset: '15px', borderRadius: '20px', border: `1px solid ${borderColor}`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: '28px', borderRadius: '16px', border: `1px solid ${primaryLine}`, pointerEvents: 'none' }} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '9px',
          background: `linear-gradient(90deg, ${primaryColor} 0%, ${accentColor} 100%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '-84px',
          top: '-92px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          border: `42px solid ${accentLine}`,
          opacity: 0.55,
          pointerEvents: 'none',
        }}
      />
    </>
  )
}
