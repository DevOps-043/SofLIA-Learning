import type { LineFieldProps } from './types'

export function LineField({ label, description, children, borderColor, mutedColor, primaryColor, align = 'left' }: LineFieldProps) {
  const justifyContent = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
  return (
    <div style={{ minHeight: '118px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ minHeight: '58px', borderBottom: '2px solid ' + borderColor, display: 'flex', alignItems: 'flex-end', justifyContent, padding: '0 8px 9px', textAlign: align }}>
        {children}
      </div>
      <div style={{ paddingTop: '10px', textAlign: align }}>
        <div style={{ fontSize: '11px', lineHeight: 1.25, letterSpacing: 0, textTransform: 'uppercase', color: mutedColor, fontWeight: 800 }}>{label}</div>
        {description ? <div style={{ marginTop: '6px', fontSize: '16px', lineHeight: 1.25, color: primaryColor, fontWeight: 800, wordBreak: 'break-word' }}>{description}</div> : null}
      </div>
    </div>
  )
}
