import type { CertificateDocumentModel } from '@/features/certificates/types/certificate'

export function renderPlatformLogo(model: CertificateDocumentModel) {
  return (
    <img
      src={model.branding.platform.logoUrl}
      alt={model.branding.platform.name}
      loading="eager"
      style={{ width: '56px', height: '56px', objectFit: 'contain' }}
    />
  )
}

export function renderIssuerLogo(model: CertificateDocumentModel, primaryColor: string) {
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
