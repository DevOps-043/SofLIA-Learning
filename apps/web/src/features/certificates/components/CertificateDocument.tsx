import type { CSSProperties, ReactNode } from 'react'
import QRCode from 'react-qr-code'
import {
  CERTIFICATE_RENDER_HEIGHT_PX,
  CERTIFICATE_RENDER_WIDTH_PX,
} from '@/features/certificates/constants/certificate-branding'
import type { CertificateDocumentModel } from '@/features/certificates/types/certificate'

interface CertificateDocumentProps {
  model: CertificateDocumentModel
  className?: string
}

interface LineFieldProps {
  label: string
  description?: string
  children: ReactNode
  borderColor: string
  mutedColor: string
  primaryColor: string
  align?: 'left' | 'center' | 'right'
}

function formatCertificateDate(dateString: string): string {
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

function colorWithAlpha(color: string, alpha: number, fallback: string): string {
  const normalized = color.trim()
  const hexMatch = normalized.match(/^#([0-9a-f]{6})$/i)

  if (!hexMatch) {
    return fallback
  }

  const alphaHex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')

  return `${normalized}${alphaHex}`
}

function buildFrameStyle(input: {
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

function buildSignatureContent(model: CertificateDocumentModel): ReactNode {
  const signatureUrl = model.document.instructorSignatureUrl
  const signatureName = model.document.instructorSignatureName?.trim()

  if (signatureUrl) {
    return (
      <img
        src={signatureUrl}
        alt={`Firma de ${model.document.instructorName}`}
        loading="eager"
        style={{
          maxWidth: '230px',
          maxHeight: '46px',
          objectFit: 'contain',
        }}
      />
    )
  }

  if (signatureName) {
    return (
      <div
        style={{
          fontSize: '24px',
          lineHeight: 1,
          color: model.branding.visualTokens.primaryColor,
          fontFamily: '"Brush Script MT", "Segoe Script", cursive',
        }}
      >
        {signatureName}
      </div>
    )
  }

  return null
}

function buildPlatformLogo(model: CertificateDocumentModel) {
  return (
    <img
      src={model.branding.platform.logoUrl}
      alt={model.branding.platform.name}
      loading="eager"
      style={{
        width: '56px',
        height: '56px',
        objectFit: 'contain',
      }}
    />
  )
}

function buildIssuerLogo(model: CertificateDocumentModel, primaryColor: string) {
  if (model.branding.issuer.logoUrl) {
    return (
      <img
        src={model.branding.issuer.logoUrl}
        alt={model.branding.issuer.name}
        loading="eager"
        style={{
          maxWidth: '162px',
          maxHeight: '42px',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    )
  }

  return (
    <div
      style={{
        fontSize: '15px',
        lineHeight: 1.2,
        fontWeight: 800,
        color: primaryColor,
        textAlign: 'center',
        wordBreak: 'break-word',
      }}
    >
      {model.branding.issuer.name}
    </div>
  )
}

function LineField({
  label,
  description,
  children,
  borderColor,
  mutedColor,
  primaryColor,
  align = 'left',
}: LineFieldProps) {
  const justifyContent =
    align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'

  return (
    <div
      style={{
        minHeight: '118px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          minHeight: '58px',
          borderBottom: `2px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent,
          padding: '0 8px 9px',
          textAlign: align,
        }}
      >
        {children}
      </div>

      <div
        style={{
          paddingTop: '10px',
          textAlign: align,
        }}
      >
        <div
          style={{
            fontSize: '11px',
            lineHeight: 1.25,
            letterSpacing: 0,
            textTransform: 'uppercase',
            color: mutedColor,
            fontWeight: 800,
          }}
        >
          {label}
        </div>

        {description ? (
          <div
            style={{
              marginTop: '6px',
              fontSize: '16px',
              lineHeight: 1.25,
              color: primaryColor,
              fontWeight: 800,
              wordBreak: 'break-word',
            }}
          >
            {description}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function CertificateDocument({
  model,
  className = '',
}: CertificateDocumentProps) {
  const {
    primaryColor,
    accentColor,
    backgroundColor,
    borderColor,
    textColor,
    mutedColor,
  } = model.branding.visualTokens

  const surfaceColor = 'rgb(255,255,255)'
  const softSurfaceColor = 'rgba(255,255,255,0.88)'
  const primarySoft = colorWithAlpha(primaryColor, 0.1, 'rgba(10,37,64,0.1)')
  const primaryLine = colorWithAlpha(primaryColor, 0.18, 'rgba(10,37,64,0.18)')
  const accentSoft = colorWithAlpha(accentColor, 0.13, 'rgba(0,212,179,0.13)')
  const accentLine = colorWithAlpha(accentColor, 0.35, 'rgba(0,212,179,0.35)')

  const platformFrameStyle = buildFrameStyle({
    width: '146px',
    height: '68px',
    borderColor,
    backgroundColor: softSurfaceColor,
    padding: '10px',
  })

  const issuerFrameStyle = buildFrameStyle({
    width: '194px',
    height: '68px',
    borderColor,
    backgroundColor: softSurfaceColor,
    padding: '10px 14px',
  })

  return (
    <div
      className={className}
      data-certificate-root="true"
      style={{
        width: `${CERTIFICATE_RENDER_WIDTH_PX}px`,
        height: `${CERTIFICATE_RENDER_HEIGHT_PX}px`,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '24px',
        border: `1px solid ${borderColor}`,
        background: `radial-gradient(circle at 12% 10%, ${accentSoft} 0%, transparent 26%), radial-gradient(circle at 96% 0%, ${primarySoft} 0%, transparent 30%), linear-gradient(135deg, ${backgroundColor} 0%, ${surfaceColor} 54%, rgb(245,250,255) 100%)`,
        boxShadow: '0 24px 60px rgba(15,23,42,0.14)',
        color: textColor,
        fontFamily: '"Segoe UI", "Inter", sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '15px',
          borderRadius: '20px',
          border: `1px solid ${borderColor}`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: '28px',
          borderRadius: '16px',
          border: `1px solid ${primaryLine}`,
          pointerEvents: 'none',
        }}
      />

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

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '30px 38px 30px',
        }}
      >
        <header
          style={{
            display: 'grid',
            gridTemplateColumns: '146px 1fr 194px',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div style={platformFrameStyle}>{buildPlatformLogo(model)}</div>

          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '14px',
                color: mutedColor,
                fontSize: '13px',
                lineHeight: 1.2,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0,
              }}
            >
              <span
                style={{
                  width: '72px',
                  height: '2px',
                  background: `linear-gradient(90deg, transparent, ${borderColor})`,
                }}
              />
              Certificado de finalizacion
              <span
                style={{
                  width: '72px',
                  height: '2px',
                  background: `linear-gradient(90deg, ${borderColor}, transparent)`,
                }}
              />
            </div>

            <div
              style={{
                marginTop: '8px',
                fontSize: '12px',
                lineHeight: 1.2,
                color: mutedColor,
                fontWeight: 600,
              }}
            >
              Credencial verificable de aprendizaje
            </div>
          </div>

          <div style={issuerFrameStyle}>
            {buildIssuerLogo(model, primaryColor)}
          </div>
        </header>

        <div
          style={{
            height: '1px',
            background: `linear-gradient(90deg, transparent 0%, ${borderColor} 18%, ${borderColor} 82%, transparent 100%)`,
          }}
        />

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
          <div
            style={{
              fontSize: '18px',
              lineHeight: 1.4,
              color: mutedColor,
              fontWeight: 600,
              marginBottom: '10px',
            }}
          >
            El presente certifica que
          </div>

          <div
            style={{
              maxWidth: '930px',
              fontSize: '54px',
              lineHeight: 1.04,
              letterSpacing: 0,
              fontWeight: 900,
              color: primaryColor,
              marginBottom: '14px',
              wordBreak: 'break-word',
            }}
          >
            {model.document.learnerName}
          </div>

          <div
            style={{
              width: '112px',
              height: '4px',
              borderRadius: '999px',
              background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
              marginBottom: '18px',
            }}
          />

          <div
            style={{
              fontSize: '18px',
              lineHeight: 1.4,
              color: mutedColor,
              fontWeight: 600,
              marginBottom: '12px',
            }}
          >
            ha completado exitosamente el curso
          </div>

          <div
            style={{
              maxWidth: '900px',
              padding: '14px 30px',
              borderTop: `1px solid ${borderColor}`,
              borderBottom: `1px solid ${borderColor}`,
              fontSize: '27px',
              lineHeight: 1.24,
              fontWeight: 850,
              color: textColor,
              wordBreak: 'break-word',
            }}
          >
            {model.document.courseTitle}
          </div>

          <div
            style={{
              maxWidth: '760px',
              marginTop: '14px',
              fontSize: '15px',
              lineHeight: 1.45,
              color: mutedColor,
              fontWeight: 500,
            }}
          >
            {model.document.programText}
          </div>
        </main>

        <footer
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) 154px minmax(0,1fr)',
              gap: '28px',
              alignItems: 'end',
            }}
          >
            <LineField
              label="Instructor"
              borderColor={borderColor}
              mutedColor={mutedColor}
              primaryColor={primaryColor}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '6px',
                }}
              >
                {buildSignatureContent(model)}
                <div
                  style={{
                    fontSize: '22px',
                    lineHeight: 1.2,
                    fontWeight: 850,
                    color: primaryColor,
                    wordBreak: 'break-word',
                  }}
                >
                  {model.document.instructorName}
                </div>
              </div>
            </LineField>

            <div
              style={{
                minHeight: '130px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
              }}
            >
              <div
                style={{
                  padding: '8px',
                  borderRadius: '16px',
                  background: surfaceColor,
                  border: `1px solid ${borderColor}`,
                  boxShadow: '0 12px 24px rgba(15,23,42,0.08)',
                }}
              >
                <QRCode
                  size={92}
                  value={model.verificationUrl}
                  fgColor={primaryColor}
                  bgColor={surfaceColor}
                />
              </div>

              <div
                style={{
                  fontSize: '10px',
                  lineHeight: 1.3,
                  color: mutedColor,
                  textAlign: 'center',
                  fontWeight: 600,
                }}
              >
                Escanea para validar
              </div>
            </div>

            <LineField
              label="Fecha de emision"
              borderColor={borderColor}
              mutedColor={mutedColor}
              primaryColor={primaryColor}
              align="right"
            >
              <div
                style={{
                  fontSize: '22px',
                  lineHeight: 1.2,
                  fontWeight: 850,
                  color: textColor,
                }}
              >
                {formatCertificateDate(model.document.issuedAt)}
              </div>
            </LineField>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,0.95fr) minmax(0,1.25fr)',
              gap: '18px',
              borderRadius: '14px',
              border: `1px solid ${borderColor}`,
              background: 'rgba(255,255,255,0.74)',
              padding: '12px 16px',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '10px',
                  lineHeight: 1.2,
                  textTransform: 'uppercase',
                  letterSpacing: 0,
                  color: mutedColor,
                  fontWeight: 800,
                  marginBottom: '5px',
                }}
              >
                Folio
              </div>
              <div
                style={{
                  fontSize: '12px',
                  lineHeight: 1.3,
                  fontWeight: 800,
                  color: primaryColor,
                  wordBreak: 'break-all',
                }}
              >
                {model.certificateId}
              </div>
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '10px',
                  lineHeight: 1.2,
                  textTransform: 'uppercase',
                  letterSpacing: 0,
                  color: mutedColor,
                  fontWeight: 800,
                  marginBottom: '5px',
                }}
              >
                Hash SHA-256
              </div>
              <div
                style={{
                  fontSize: '10.5px',
                  lineHeight: 1.35,
                  color: mutedColor,
                  wordBreak: 'break-all',
                  fontWeight: 600,
                }}
              >
                {model.certificateHash}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
