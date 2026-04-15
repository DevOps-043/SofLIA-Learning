import type { CSSProperties } from 'react'
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
    borderRadius: '18px',
    border: `1px solid ${input.borderColor}`,
    background: input.backgroundColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: input.padding,
  }
}

function buildSignatureContent(model: CertificateDocumentModel) {
  const signatureUrl = model.document.instructorSignatureUrl
  const signatureName = model.document.instructorSignatureName?.trim()

  if (signatureUrl) {
    return (
      <img
        src={signatureUrl}
        alt={`Firma de ${model.document.instructorName}`}
        style={{
          maxWidth: '180px',
          maxHeight: '44px',
          objectFit: 'contain',
        }}
      />
    )
  }

  if (signatureName) {
    return (
      <div
        style={{
          fontSize: '22px',
          lineHeight: 1,
          color: model.branding.visualTokens.primaryColor,
          fontFamily: '"Brush Script MT", "Segoe Script", cursive',
        }}
      >
        {signatureName}
      </div>
    )
  }

  return (
    <div
      style={{
        width: '150px',
        borderBottom: `2px solid ${model.branding.visualTokens.borderColor}`,
      }}
    />
  )
}

function buildPlatformLogo(model: CertificateDocumentModel) {
  return (
    <img
      src={model.branding.platform.logoUrl}
      alt={model.branding.platform.name}
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
        style={{
          maxWidth: '150px',
          maxHeight: '40px',
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
  const hasSignatureVisual = Boolean(
    model.document.instructorSignatureUrl ||
      model.document.instructorSignatureName?.trim(),
  )

  const platformFrameStyle = buildFrameStyle({
    width: '148px',
    height: '70px',
    borderColor,
    backgroundColor: 'rgba(255,255,255,0.94)',
    padding: '10px',
  })

  const issuerFrameStyle = buildFrameStyle({
    width: '186px',
    height: '70px',
    borderColor,
    backgroundColor: 'rgba(255,255,255,0.94)',
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
        background: `radial-gradient(circle at 100% 0%, ${accentColor}16 0%, transparent 24%), linear-gradient(135deg, ${backgroundColor} 0%, #FFFFFF 54%, #F5FAFF 100%)`,
        boxShadow: '0 24px 60px rgba(15, 23, 42, 0.14)',
        color: textColor,
        fontFamily: '"Segoe UI", "Inter", sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '14px',
          borderRadius: '20px',
          border: `1px solid ${borderColor}`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: '26px',
          borderRadius: '18px',
          border: `1px solid ${primaryColor}1F`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '8px',
          background: `linear-gradient(90deg, ${primaryColor} 0%, ${accentColor} 100%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          padding: '28px 30px 24px',
        }}
      >
        <header
          style={{
            display: 'grid',
            gridTemplateColumns: '148px 1fr 186px',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={platformFrameStyle}>{buildPlatformLogo(model)}</div>

          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '12px',
                letterSpacing: '0.34em',
                textTransform: 'uppercase',
                color: mutedColor,
                fontWeight: 800,
              }}
            >
              Certificado de finalizacion
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
            padding: '0 20px',
          }}
        >
          <div
            style={{
              fontSize: '18px',
              lineHeight: 1.4,
              color: mutedColor,
              fontWeight: 500,
              marginBottom: '10px',
            }}
          >
            El presente certifica que
          </div>

          <div
            style={{
              maxWidth: '860px',
              fontSize: '50px',
              lineHeight: 1.04,
              letterSpacing: '-0.05em',
              fontWeight: 900,
              color: primaryColor,
              marginBottom: '12px',
            }}
          >
            {model.document.learnerName}
          </div>

          <div
            style={{
              fontSize: '18px',
              lineHeight: 1.4,
              color: mutedColor,
              fontWeight: 500,
              marginBottom: '12px',
            }}
          >
            ha completado exitosamente el curso
          </div>

          <div
            style={{
              maxWidth: '860px',
              fontSize: '24px',
              lineHeight: 1.24,
              fontWeight: 800,
              color: textColor,
              marginBottom: '10px',
            }}
          >
            {model.document.courseTitle}
          </div>

          <div
            style={{
              maxWidth: '760px',
              fontSize: '16px',
              lineHeight: 1.45,
              color: mutedColor,
            }}
          >
            {model.document.programText}
          </div>
        </main>

        <footer
          style={{
            display: 'grid',
            gridTemplateColumns: '0.94fr 0.62fr 0.98fr',
            gap: '14px',
            alignItems: 'stretch',
          }}
        >
          <section
            style={{
              minHeight: hasSignatureVisual ? '112px' : '96px',
              borderRadius: '18px',
              border: `1px solid ${borderColor}`,
              background: 'rgba(255,255,255,0.82)',
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                minHeight: hasSignatureVisual ? '28px' : '14px',
                display: 'flex',
                alignItems: 'flex-end',
              }}
            >
              {buildSignatureContent(model)}
            </div>

            <div
              style={{
                marginTop: '8px',
                paddingTop: '10px',
                borderTop: `2px solid ${borderColor}`,
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: mutedColor,
                  fontWeight: 800,
                  marginBottom: '8px',
                }}
              >
                Instructor
              </div>

              <div
                style={{
                  fontSize: '16px',
                  lineHeight: 1.3,
                  color: primaryColor,
                  fontWeight: 800,
                  wordBreak: 'break-word',
                }}
              >
                {model.document.instructorName}
              </div>
            </div>
          </section>

          <section
            style={{
              minHeight: '122px',
              borderRadius: '18px',
              border: `1px solid ${borderColor}`,
              background: 'rgba(255,255,255,0.82)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                padding: '8px',
                borderRadius: '16px',
                background: '#FFFFFF',
                border: `1px solid ${borderColor}`,
              }}
            >
              <QRCode
                size={88}
                value={model.verificationUrl}
                fgColor={primaryColor}
                bgColor="#FFFFFF"
              />
            </div>

            <div
              style={{
                fontSize: '10px',
                lineHeight: 1.4,
                color: mutedColor,
                textAlign: 'center',
              }}
            >
              Escanea para validar este certificado
            </div>
          </section>

          <section
            style={{
              minHeight: '122px',
              borderRadius: '18px',
              border: `1px solid ${borderColor}`,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(247,251,255,0.94) 100%)',
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: mutedColor,
                  fontWeight: 800,
                  marginBottom: '8px',
                }}
              >
                Fecha de emision
              </div>

              <div
                style={{
                  fontSize: '18px',
                  lineHeight: 1.25,
                  fontWeight: 800,
                  color: textColor,
                }}
              >
                {formatCertificateDate(model.document.issuedAt)}
              </div>
            </div>

            <div
              style={{
                marginTop: '8px',
                paddingTop: '10px',
                borderTop: `2px solid ${borderColor}`,
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: mutedColor,
                  fontWeight: 800,
                  marginBottom: '8px',
                }}
              >
                Folio y hash
              </div>

              <div
                style={{
                  fontSize: '11.5px',
                  lineHeight: 1.3,
                  fontWeight: 800,
                  color: primaryColor,
                  wordBreak: 'break-all',
                  marginBottom: '5px',
                }}
              >
                {model.certificateId}
              </div>

              <div
                style={{
                  fontSize: '10px',
                  lineHeight: 1.4,
                  color: mutedColor,
                  wordBreak: 'break-all',
                }}
              >
                Hash: {model.certificateHash}
              </div>
            </div>
          </section>
        </footer>
      </div>
    </div>
  )
}
