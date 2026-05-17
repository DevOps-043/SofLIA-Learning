import type { ReactNode } from 'react'

interface CertificateFrameProps {
  accentColor: string
  children: ReactNode
  isExpanded: boolean
  primaryColor: string
  secondaryColor: string
}

export function CertificateFrame({
  accentColor,
  children,
  isExpanded,
  primaryColor,
  secondaryColor,
}: CertificateFrameProps) {
  return (
    <div className={`w-full ${isExpanded ? '' : 'h-full'} flex relative bg-gradient-to-br from-gray-50 to-white`} style={isExpanded ? { aspectRatio: '8.5 / 11', minHeight: '1056px', height: '100%' } : {}}>
      <div className="absolute inset-0 border-8" style={{ borderColor: primaryColor }} />
      <div className="absolute inset-2 border-4" style={{ borderColor: secondaryColor }} />
      <div className="absolute inset-4 border-2" style={{ borderColor: accentColor }} />
      <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4" style={{ borderColor: accentColor }} />
      <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4" style={{ borderColor: accentColor }} />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4" style={{ borderColor: accentColor }} />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4" style={{ borderColor: accentColor }} />
      <div className="flex-1 p-12 flex flex-col relative z-10">
        {children}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 w-12 h-32 opacity-20">
          <div className="w-full h-full border-l-4" style={{ borderColor: accentColor }} />
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-32 opacity-20">
          <div className="w-full h-full border-r-4" style={{ borderColor: accentColor }} />
        </div>
      </div>
    </div>
  )
}
