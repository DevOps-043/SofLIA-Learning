'use client'

import React from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { getFullUrl } from '../../../lib/env'

// Importación dinámica de QRCode para evitar problemas con SSR
const QRCode = dynamic(() => import('react-qr-code').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="w-[110px] h-[110px] bg-gray-200 animate-pulse rounded" />
})

interface CertificateDisplayProps {
  studentName: string
  courseName: string
  issueDate: string
  instructorSignatureUrl?: string | null
  instructorSignatureName?: string | null
  instructorDisplayName?: string | null
  certificateHash?: string | null
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  className?: string
}

export function CertificateDisplay({
  studentName,
  courseName,
  issueDate,
  instructorSignatureUrl,
  instructorSignatureName,
  instructorDisplayName,
  certificateHash,
  primaryColor = '#1e3a8a',
  secondaryColor = '#60a5fa',
  accentColor = '#d4af37',
  className = ''
}: CertificateDisplayProps) {
  // Función auxiliar para renderizar la firma del instructor
  const renderInstructorSignature = () => {
    const hasSignatureName = instructorSignatureName && typeof instructorSignatureName === 'string' && instructorSignatureName.trim().length > 0
    const hasSignatureUrl = instructorSignatureUrl && typeof instructorSignatureUrl === 'string' && instructorSignatureUrl.trim().length > 0
    
    if (hasSignatureName && !hasSignatureUrl) {
      // Mostrar nombre arriba de la línea
      return (
        <>
          <div className="text-base font-bold mb-3 px-2" style={{ color: primaryColor }}>
            {instructorSignatureName.trim()}
          </div>
          <div className="h-1 w-40 border-b-4 mx-auto mb-3" style={{ borderColor: primaryColor }}></div>
          <div className="text-xs text-gray-600">Instructor</div>
        </>
      )
    } else if (hasSignatureUrl) {
      // Mostrar imagen de firma
      return (
        <>
          <div className="mb-3 flex justify-center">
            <img
              src={instructorSignatureUrl.trim()}
              alt="Firma del instructor"
              className="h-20 w-48 object-contain"
            />
          </div>
          <div className="h-1 w-40 border-b-4 mx-auto mb-3" style={{ borderColor: primaryColor }}></div>
          {instructorDisplayName ? (
            <div className="text-base font-bold px-2" style={{ color: primaryColor }}>
              {instructorDisplayName}
            </div>
          ) : (
            <div className="text-xs text-gray-600">Instructor</div>
          )}
        </>
      )
    } else {
      // No hay firma configurada
      return (
        <>
          <div className="h-16 w-40 border-b-4 mx-auto mb-3" style={{ borderColor: primaryColor }}></div>
          <div className="text-sm font-semibold mb-1" style={{ color: primaryColor }}>
            [Firma del Instructor]
          </div>
          <div className="text-xs text-gray-600">Instructor</div>
        </>
      )
    }
  }

  const verifyUrl = certificateHash 
    ? getFullUrl(`/certificates/verify/${certificateHash}`)
    : getFullUrl('/certificates/verify/[hash]')

  return (
    <div 
      className={`w-full flex relative bg-gradient-to-br from-gray-50 to-white ${className}`}
      style={{ aspectRatio: '8.5 / 11', minHeight: '1056px' }}
    >
      {/* Bordes decorativos externos */}
      <div className="absolute inset-0 border-8" style={{ borderColor: primaryColor }}></div>
      <div className="absolute inset-2 border-4" style={{ borderColor: secondaryColor }}></div>
      <div className="absolute inset-4 border-2" style={{ borderColor: accentColor }}></div>
      
      {/* Esquinas decorativas ornamentales */}
      <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4" style={{ borderColor: accentColor }}></div>
      <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4" style={{ borderColor: accentColor }}></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4" style={{ borderColor: accentColor }}></div>
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4" style={{ borderColor: accentColor }}></div>
      
      {/* Contenido principal */}
      <div className="flex-1 p-12 flex flex-col relative z-10">
        {/* Contenido del certificado */}
        <div className="flex flex-col justify-between items-center text-center h-full">
          {/* Logo de SofLIA */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div 
                className="absolute inset-0 blur-xl opacity-20 rounded-full"
                style={{ 
                  background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`,
                  transform: 'scale(1.2)'
                }}
              ></div>
              <Image
                src="/icono.png"
                alt="Aprende y Aplica"
                width={100}
                height={100}
                className="w-20 h-20 object-contain relative z-10"
              />
            </div>
          </div>

          {/* Nombre de la plataforma */}
          <div className="text-3xl font-bold mb-8 tracking-wide" style={{ 
            color: primaryColor,
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}>
            SofLIA
          </div>
          
          {/* Línea decorativa */}
          <div className="w-64 h-1 mb-10 mx-auto" style={{ 
            background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`
          }}></div>
          
          {/* Texto del certificado */}
          <div className="text-lg mb-4 text-gray-700 max-w-3xl font-medium leading-relaxed px-8">
            El presente certifica que
          </div>
          
          <div className="text-4xl font-bold mb-4 px-6 py-3 border-4 rounded-lg" style={{ 
            color: secondaryColor,
            borderColor: primaryColor,
            backgroundColor: 'rgba(30, 58, 138, 0.05)',
            transform: 'translateY(-8px)'
          }}>
            {studentName}
          </div>
          
          <div className="text-lg mb-4 text-gray-700 max-w-3xl font-medium leading-relaxed px-8">
            ha completado exitosamente el curso
          </div>
          
          <div className="text-2xl font-semibold mb-8 px-6 py-3 border-2 rounded" style={{ 
            color: primaryColor,
            borderColor: secondaryColor,
            backgroundColor: 'rgba(96, 165, 250, 0.1)',
            transform: 'translateY(-8px)'
          }}>
            {courseName}
          </div>

          {/* Firmas, QR Code y Fecha - Footer */}
          <div className="flex justify-between items-center w-full mt-6 px-8 pb-4 border-t-2 pt-6" style={{ borderColor: accentColor }}>
            {/* Firma del Instructor - Izquierda */}
            <div className="text-center flex-1 flex flex-col items-center justify-center">
              {renderInstructorSignature()}
            </div>
            
            {/* QR Code - Centro */}
            <div className="flex-shrink-0 mx-8 flex flex-col items-center justify-center">
              <div className="bg-white p-3 rounded-lg border-2 shadow-lg" style={{ borderColor: primaryColor }}>
                <QRCode
                  value={verifyUrl}
                  size={110}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  fgColor={primaryColor}
                  bgColor="#ffffff"
                />
              </div>
            </div>
            
            {/* Fecha - Derecha */}
            <div className="text-center flex-1 flex flex-col items-center justify-center" style={{ transform: 'translateY(-8px)' }}>
              <div className="text-sm font-semibold mb-2" style={{ color: primaryColor }}>
                Fecha de Emisión
              </div>
              <div className="text-base font-medium text-gray-700 border-2 rounded px-4 py-2 inline-block" style={{ borderColor: secondaryColor }}>
                {issueDate}
              </div>
            </div>
          </div>
        </div>

        {/* Decoraciones laterales */}
        <div className="absolute left-8 top-1/2 transform -translate-y-1/2 w-12 h-32 opacity-20">
          <div className="w-full h-full border-l-4" style={{ borderColor: accentColor }}></div>
        </div>
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 w-12 h-32 opacity-20">
          <div className="w-full h-full border-r-4" style={{ borderColor: accentColor }}></div>
        </div>
      </div>
    </div>
  )
}

