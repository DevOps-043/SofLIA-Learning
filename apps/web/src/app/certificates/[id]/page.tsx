'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Award,
  Calendar,
  Download,
  ExternalLink,
  Shield,
  User,
  BookOpen,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Copy,
  Share2
} from 'lucide-react'
import { getFullUrl } from '@/lib/env'
import { CertificateDisplay } from '@/core/components/CertificateDisplay/CertificateDisplay'
import { generateCertificatePDF } from '@/core/utils/certificatePDF'
import { useShareModalContext } from '@/core/providers/ShareModalProvider'

interface Certificate {
  certificate_id: string
  certificate_url: string
  certificate_hash: string
  issued_at: string
  expires_at: string | null
  created_at: string
  course_id: string
  enrollment_id: string
  course_title: string
  course_slug: string
  course_thumbnail: string | null
  instructor_name: string
  instructor_username: string | null
  instructor_signature_url?: string | null
  instructor_signature_name?: string | null
  user_name?: string
}

export default function CertificateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { openShareModal } = useShareModalContext()
  const certificateId = params.id as string
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (certificateId) {
      fetchCertificate()
    }
  }, [certificateId])

  const fetchCertificate = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/certificates', {
        credentials: 'include'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al cargar certificado')
      }

      const data = await response.json()
      
      if (data.success && data.certificates) {
        const foundCertificate = data.certificates.find(
          (cert: Certificate) => cert.certificate_id === certificateId
        )
        
        if (foundCertificate) {
          setCertificate(foundCertificate)
        } else {
          throw new Error('Certificado no encontrado')
        }
      } else {
        throw new Error(data.error || 'Error al obtener certificado')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const handleDownload = async () => {
    if (!certificate) return

    try {
      // Generar PDF desde el componente HTML renderizado
      const fileName = `${certificate.course_title.replace(/[^a-z0-9]/gi, '_')}_certificado.pdf`
      await generateCertificatePDF('certificate-display', fileName)
    } catch (err) {
      console.error('Error generando PDF:', err)
      alert(err instanceof Error ? err.message : 'Error al generar el certificado PDF')
    }
  }

  const handleVerify = () => {
    if (certificate) {
      router.push(`/certificates/verify/${certificate.certificate_hash}`)
    }
  }

  const copyHash = () => {
    if (certificate) {
      navigator.clipboard.writeText(certificate.certificate_hash)
      alert('Hash copiado al portapapeles')
    }
  }

  const shareCertificate = () => {
    if (certificate) {
      const verifyUrl = getFullUrl(`/certificates/verify/${certificate.certificate_hash}`)
      const shareTitle = `Certificado: ${certificate.course_title}`
      const shareText = `He completado el curso "${certificate.course_title}" y obtuve este certificado.`
      
      // Abrir modal de compartir global
      openShareModal({
        url: verifyUrl,
        title: shareTitle,
        text: shareText,
        description: shareText,
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0F1419] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#0A2540] dark:text-[#00D4B3] animate-spin" />
          <p className="text-[#6C757D] dark:text-gray-400 text-lg">Cargando certificado...</p>
        </div>
      </div>
    )
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0F1419] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500" />
          <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white">Error</h2>
          <p className="text-[#6C757D] dark:text-gray-400">{error || 'Certificado no encontrado'}</p>
          <button
            onClick={() => router.push('/certificates')}
            className="px-6 py-3 bg-[#0A2540] dark:bg-[#0A2540] text-white rounded-lg font-medium hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d] transition-colors"
          >
            Volver a Certificados
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1419]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <button
          onClick={() => router.push('/certificates')}
          className="flex items-center gap-2 text-[#0A2540] dark:text-gray-400 hover:text-[#0d2f4d] dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver a Certificados</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Certificate Image */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-[#1E2329] rounded-xl shadow-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 overflow-hidden"
            >
              <div className="w-full bg-white p-8 flex items-center justify-center overflow-auto">
                <div className="w-full max-w-4xl" style={{ maxWidth: '816px' }}>
                  <div id="certificate-display">
                    <CertificateDisplay
                      studentName={certificate.user_name || 'Estudiante'}
                      courseName={certificate.course_title}
                      issueDate={formatDate(certificate.issued_at)}
                      instructorSignatureUrl={certificate.instructor_signature_url}
                      instructorSignatureName={certificate.instructor_signature_name}
                      instructorDisplayName={certificate.instructor_name}
                      certificateHash={certificate.certificate_hash}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0A2540] dark:bg-[#0A2540] text-white rounded-lg font-medium hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d] transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Descargar
                  </button>
                  <button
                    onClick={handleVerify}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#E9ECEF] dark:bg-[#0F1419] text-[#0A2540] dark:text-gray-300 rounded-lg font-medium hover:bg-[#6C757D]/20 dark:hover:bg-[#0A2540]/30 transition-colors border border-[#E9ECEF] dark:border-[#6C757D]/30"
                  >
                    <Shield className="w-5 h-5" />
                    Verificar
                  </button>
                  <button
                    onClick={shareCertificate}
                    className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-[#E9ECEF]/50 dark:bg-[#0A2540]/10 text-[#0A2540] dark:text-gray-300 rounded-lg font-medium hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 transition-colors border border-[#E9ECEF] dark:border-[#6C757D]/30"
                  >
                    <Share2 className="w-5 h-5" />
                    Compartir Certificado
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Certificate Info */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-[#1E2329] rounded-xl shadow-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 p-6 space-y-6"
            >
              {/* Status Badge */}
              <div className="flex items-center gap-3 p-4 bg-[#10B981]/10 dark:bg-[#10B981]/20 rounded-lg border border-[#10B981] dark:border-[#10B981]">
                <CheckCircle2 className="w-6 h-6 text-[#10B981] dark:text-[#10B981]" />
                <div>
                  <p className="text-sm font-semibold text-[#10B981] dark:text-[#10B981]">
                    Certificado Válido
                  </p>
                  <p className="text-xs text-[#0A2540] dark:text-gray-300">
                    Verificado y autenticado
                  </p>
                </div>
              </div>

              {/* Course Info */}
              <div>
                <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white mb-4">
                  {certificate.course_title}
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-[#6C757D] dark:text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-[#6C757D] dark:text-gray-400">Instructor</p>
                      <p className="font-medium text-[#0A2540] dark:text-white">
                        {certificate.instructor_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-[#6C757D] dark:text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-[#6C757D] dark:text-gray-400">Fecha de Emisión</p>
                      <p className="font-medium text-[#0A2540] dark:text-white">
                        {formatDate(certificate.issued_at)}
                      </p>
                    </div>
                  </div>

                  {certificate.expires_at && (
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-[#F59E0B] dark:text-[#F59E0B] mt-0.5" />
                      <div>
                        <p className="text-sm text-[#6C757D] dark:text-gray-400">Fecha de Expiración</p>
                        <p className="font-medium text-[#F59E0B] dark:text-[#F59E0B]">
                          {formatDate(certificate.expires_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hash Blockchain */}
              <div className="pt-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#0A2540] dark:text-[#00D4B3]" />
                    <p className="text-sm font-semibold text-[#0A2540] dark:text-white">
                      Hash Blockchain
                    </p>
                  </div>
                  <button
                    onClick={copyHash}
                    className="p-1 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/20 rounded transition-colors"
                    title="Copiar hash"
                  >
                    <Copy className="w-4 h-4 text-[#6C757D] dark:text-gray-400" />
                  </button>
                </div>
                <p className="text-xs font-mono text-[#0A2540] dark:text-gray-400 break-all bg-[#E9ECEF]/30 dark:bg-[#0F1419] p-3 rounded-lg border border-[#E9ECEF] dark:border-[#6C757D]/30">
                  {certificate.certificate_hash}
                </p>
                <p className="text-xs text-[#6C757D] dark:text-gray-400 mt-2">
                  Este hash único garantiza la autenticidad del certificado mediante tecnología blockchain
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

