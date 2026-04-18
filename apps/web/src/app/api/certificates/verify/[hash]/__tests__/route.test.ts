import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { getCertificateByHashMock } = vi.hoisted(() => ({
  getCertificateByHashMock: vi.fn(),
}))

vi.mock('@/features/certificates/services/certificate-data.server', () => ({
  CertificateDataService: {
    getCertificateByHash: getCertificateByHashMock,
  },
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    log: vi.fn(),
  },
}))

import { GET } from '../route'

function createRequest(hash: string) {
  return new NextRequest(`http://localhost:3000/api/certificates/verify/${hash}`)
}

const baseCertificate = {
  certificateId: 'certificate-1',
  certificateHash: 'valid-hash',
  issuedAt: '2026-04-11T18:00:00.000Z',
  expiresAt: null,
  courseTitle: 'IA para líderes',
  instructorName: 'Ana Sofía',
  issuerName: 'Board Ready',
  issuerLogoUrl: 'https://cdn.example.com/logo.png',
  certificateUrl: 'https://storage.example.com/certificate.pdf',
  documentModel: {
    certificateId: 'certificate-1',
    certificateHash: 'valid-hash',
    certificateUrl: 'https://storage.example.com/certificate.pdf',
    issuedAt: '2026-04-11T18:00:00.000Z',
    expiresAt: null,
    verificationUrl: 'http://localhost:3000/certificates/verify/valid-hash',
    fileName: 'ia_para_lideres_certificado.pdf',
    courseId: 'course-1',
    courseSlug: 'ia-lideres',
    enrollmentId: 'enrollment-1',
    branding: {
      platform: { name: 'SofLIA', logoUrl: 'http://localhost:3000/icono.png' },
      issuer: {
        organizationId: 'org-1',
        name: 'Board Ready',
        logoUrl: 'https://cdn.example.com/logo.png',
      },
      visualTokens: {
        primaryColor: '#0A2540',
        accentColor: '#00D4B3',
        borderColor: '#D6E3F1',
        backgroundColor: '#F7FBFF',
        textColor: '#0F172A',
        mutedColor: '#475569',
      },
      legacyMode: false,
    },
    document: {
      learnerName: 'Israel Martínez',
      courseTitle: 'IA para líderes',
      instructorName: 'Ana Sofía',
      instructorSignatureUrl: null,
      instructorSignatureName: '',
      issuedAt: '2026-04-11T18:00:00.000Z',
      programText: 'Forma parte del programa de capacitación de Board Ready',
    },
  },
}

describe('/api/certificates/verify/[hash]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 404 when certificate is not found', async () => {
    getCertificateByHashMock.mockResolvedValue(null)

    const response = await GET(createRequest('missing-hash'), {
      params: Promise.resolve({ hash: 'missing-hash' }),
    })
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.valid).toBe(false)
  })

  it('returns valid=true for a non-expired certificate', async () => {
    getCertificateByHashMock.mockResolvedValue(baseCertificate)

    const response = await GET(createRequest('valid-hash'), {
      params: Promise.resolve({ hash: 'valid-hash' }),
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      valid: true,
      expired: false,
      chainOk: true,
      lastOperation: 'ISSUE',
      certificate: {
        certificateId: 'certificate-1',
        issuerName: 'Board Ready',
      },
    })
    expect(getCertificateByHashMock).toHaveBeenCalledWith('valid-hash')
  })

  it('returns valid=false and expired=true for an expired certificate', async () => {
    getCertificateByHashMock.mockResolvedValue({
      ...baseCertificate,
      expiresAt: '2020-01-01T00:00:00.000Z',
    })

    const response = await GET(createRequest('expired-hash'), {
      params: Promise.resolve({ hash: 'expired-hash' }),
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.valid).toBe(false)
    expect(payload.expired).toBe(true)
  })

  it('returns 500 when the data service throws', async () => {
    getCertificateByHashMock.mockRejectedValue(new Error('DB connection failed'))

    const response = await GET(createRequest('any-hash'), {
      params: Promise.resolve({ hash: 'any-hash' }),
    })
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.details).toBe('DB connection failed')
  })
})
