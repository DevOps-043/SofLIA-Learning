import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

// Import dinámico de jsPDF para evitar problemas en servidor
type JsPdfDocument = {
  ellipse?: (x: number, y: number, rx: number, ry: number, style?: 'F' | 'D' | 'FD') => void
  line: (x1: number, y1: number, x2: number, y2: number) => void
  rect: (x: number, y: number, width: number, height: number, style?: 'F' | 'D' | 'FD') => void
  setFillColor: (...color: number[]) => void
  setDrawColor: (...color: number[]) => void
  setLineWidth: (width: number) => void
  setFontSize: (size: number) => void
  setTextColor: (...color: number[]) => void
  setFont: (fontName: string, fontStyle: string) => void
  text: (text: string, x: number, y: number, options?: Record<string, unknown>) => void
  output: (type: 'arraybuffer') => ArrayBuffer
}

type JsPdfConstructor = new (options: {
  orientation: 'landscape' | 'portrait'
  unit: string
  format: [number, number]
}) => JsPdfDocument

let jsPDF: JsPdfConstructor | null = null
async function getJsPDF(): Promise<JsPdfConstructor> {
  if (!jsPDF) {
    jsPDF = (await import('jspdf')).default
  }
  return jsPDF
}

/**
 * Dibuja un círculo usando métodos básicos de jsPDF (compatible estándar)
 */
function drawCircle(doc: JsPdfDocument, x: number, y: number, radius: number, style: 'F' | 'D' | 'FD' = 'FD') {
  try {
    // Intentar usar ellipse si está disponible (jsPDF 2.x+)
    if (typeof doc.ellipse === 'function') {
      doc.ellipse(x, y, radius, radius, style)
      return
    }
  } catch (e) {
    // Continuar con método alternativo
  }
  
  // Método alternativo: dibujar círculo usando polígono (múltiples lados para simular círculo)
  const sides = 64 // Más lados = más circular
  const step = (2 * Math.PI) / sides
  const points: Array<[number, number]> = []
  
  for (let i = 0; i <= sides; i++) {
    const angle = i * step
    points.push([x + radius * Math.cos(angle), y + radius * Math.sin(angle)])
  }
  
  // Dibujar contorno del polígono
  if (style.includes('D')) {
    for (let i = 0; i < points.length - 1; i++) {
      doc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1])
    }
  }
  
  // Rellenar: dibujar círculos concéntricos más pequeños
  if (style.includes('F')) {
    const fillSteps = Math.ceil(radius)
    for (let r = radius; r > 0; r -= 0.3) {
      const currentPoints: Array<[number, number]> = []
      for (let i = 0; i <= sides; i++) {
        const angle = i * step
        currentPoints.push([x + r * Math.cos(angle), y + r * Math.sin(angle)])
      }
      for (let i = 0; i < currentPoints.length - 1; i++) {
        doc.line(currentPoints[i][0], currentPoints[i][1], currentPoints[i + 1][0], currentPoints[i + 1][1])
      }
    }
  }
}

/**
 * Versión simplificada: dibuja un círculo pequeño (punto decorativo)
 */
function drawCircleSimple(doc: JsPdfDocument, x: number, y: number, radius: number) {
  // Para círculos pequeños, usar un rectángulo pequeño como aproximación
  doc.rect(x - radius, y - radius, radius * 2, radius * 2, 'F')
}

interface GenerateCertificateParams {
  userId: string
  courseId: string
  enrollmentId: string
  courseTitle: string
  instructorName: string
  userName: string
}

/**
 * Servicio para generar certificados automáticamente cuando un curso se completa
 */
export class CertificateService {
  /**
   * Genera un certificado PDF y lo guarda en Supabase Storage
   */
  static async generateCertificate(params: GenerateCertificateParams): Promise<string | null> {
    try {
      const { userId, courseId, enrollmentId, courseTitle, instructorName, userName } = params
      const supabase = await createClient()

      // Verificar si ya existe un certificado para este usuario y curso
      const { data: existingCertificate } = await supabase
        .from('user_course_certificates')
        .select('certificate_id, certificate_url')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single()

      if (existingCertificate) {
        logger.log('Certificado ya existe para este usuario y curso:', existingCertificate.certificate_id)
        return existingCertificate.certificate_url
      }

      // Generar PDF del certificado
      const pdfBuffer = await this.createCertificatePDF({
        courseTitle,
        instructorName,
        userName,
        issueDate: new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      })

      // Generar nombre único para el archivo
      const timestamp = Date.now()
      const sanitizedCourseTitle = courseTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)
      // El path debe ser relativo al bucket (no incluir el nombre del bucket)
      const filePath = `${userId}/${sanitizedCourseTitle}-${timestamp}.pdf`

      // Subir PDF al bucket de certificados
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(filePath, pdfBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf'
        })

      if (uploadError) {
        logger.error('Error subiendo certificado a storage:', uploadError)
        // Intentar con otro nombre de bucket común
        const alternativeBuckets = ['certificate', 'certificados', 'certificate-files']
        let uploaded = false

        for (const bucketName of alternativeBuckets) {
          const { data: altData, error: altError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, pdfBuffer, {
              cacheControl: '3600',
              upsert: false,
              contentType: 'application/pdf'
            })

          if (!altError && altData) {
            logger.log(`Certificado subido exitosamente al bucket: ${bucketName}`)
            uploaded = true
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath)
            
            if (urlData?.publicUrl) {
              return urlData.publicUrl
            }
          }
        }

        if (!uploaded) {
          throw new Error(`Error al subir certificado: ${uploadError.message}`)
        }
      }

      // Obtener URL pública del certificado
      const { data: urlData } = supabase.storage
        .from('certificates')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        throw new Error('Error al obtener URL pública del certificado')
      }

      logger.log('Certificado generado exitosamente:', urlData.publicUrl)
      return urlData.publicUrl
    } catch (error) {
      logger.error('Error generando certificado:', error)
      return null
    }
  }

  /**
   * Crea el PDF del certificado usando jsPDF
   */
  private static async createCertificatePDF(params: {
    courseTitle: string
    instructorName: string
    userName: string
    issueDate: string
  }): Promise<Buffer> {
    const { courseTitle, instructorName, userName, issueDate } = params

    // Importar jsPDF dinámicamente
    const jsPDFClass = await getJsPDF()
    
    // Crear documento PDF (A4: 210mm x 297mm)
    const doc = new jsPDFClass({
      orientation: 'landscape',
      unit: 'mm',
      format: [297, 210] // A4 landscape
    })

    // Configuración de colores mejorados
    const primaryColor = [37, 99, 235] // blue-600 - más vibrante
    const secondaryColor = [59, 130, 246] // blue-500 - para acentos
    const accentColor = [99, 102, 241] // indigo-500 - para decoraciones
    const textColor = [30, 41, 59] // slate-800 - más oscuro para mejor contraste
    const lightGray = [241, 245, 249] // slate-100 - para fondos sutiles
    const borderColor = [203, 213, 225] // slate-300 - bordes

    // Fondo con gradiente simulado (usando rectángulos)
    doc.setFillColor(...lightGray)
    doc.rect(0, 0, 297, 210, 'F')

    // Borde exterior decorativo (más grueso y elegante)
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(3)
    doc.rect(8, 8, 281, 194)

    // Borde medio con patrón decorativo
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(1.5)
    doc.rect(12, 12, 273, 186)

    // Borde interno fino
    doc.setDrawColor(...accentColor)
    doc.setLineWidth(0.5)
    doc.rect(16, 16, 265, 178)

    // Decoraciones en las esquinas (ornamentos simples)
    const cornerSize = 15
    const cornerOffset = 20
    
    // Esquina superior izquierda
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(2)
    doc.line(cornerOffset, cornerOffset, cornerOffset + cornerSize, cornerOffset)
    doc.line(cornerOffset, cornerOffset, cornerOffset, cornerOffset + cornerSize)
    
    // Esquina superior derecha
    doc.line(297 - cornerOffset - cornerSize, cornerOffset, 297 - cornerOffset, cornerOffset)
    doc.line(297 - cornerOffset, cornerOffset, 297 - cornerOffset, cornerOffset + cornerSize)
    
    // Esquina inferior izquierda
    doc.line(cornerOffset, 210 - cornerOffset, cornerOffset + cornerSize, 210 - cornerOffset)
    doc.line(cornerOffset, 210 - cornerOffset - cornerSize, cornerOffset, 210 - cornerOffset)
    
    // Esquina inferior derecha
    doc.line(297 - cornerOffset - cornerSize, 210 - cornerOffset, 297 - cornerOffset, 210 - cornerOffset)
    doc.line(297 - cornerOffset, 210 - cornerOffset - cornerSize, 297 - cornerOffset, 210 - cornerOffset)

    // Líneas decorativas horizontales superiores
    doc.setDrawColor(...accentColor)
    doc.setLineWidth(0.5)
    doc.line(50, 35, 247, 35)
    doc.line(55, 38, 242, 38)

    // Sello decorativo circular (simulado con círculo y texto)
    const sealX = 148.5
    const sealY = 180
    const sealRadius = 12
    
    doc.setDrawColor(...primaryColor)
    doc.setFillColor(...lightGray)
    doc.setLineWidth(2)
    // Dibujar círculo usando función auxiliar
    drawCircle(doc, sealX, sealY, sealRadius, 'FD')
    
    doc.setFontSize(8)
    doc.setTextColor(...primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text('APRENDE', sealX, sealY - 3, { align: 'center' })
    doc.text('Y APLICA', sealX, sealY + 1, { align: 'center' })
    doc.text('✓', sealX, sealY + 5, { align: 'center' })

    // Título principal con sombra simulada
    doc.setFontSize(52)
    doc.setTextColor(...primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text('CERTIFICADO', 148.5, 52, { align: 'center' })
    
    // Sombra del título (texto duplicado con offset)
    doc.setFontSize(52)
    doc.setTextColor(200, 200, 200)
    doc.text('CERTIFICADO', 149, 52.5, { align: 'center' })

    // Línea decorativa bajo el título
    doc.setDrawColor(...secondaryColor)
    doc.setLineWidth(1)
    doc.line(60, 58, 237, 58)
    
    // Puntos decorativos
    doc.setFillColor(...secondaryColor)
    drawCircleSimple(doc, 65, 58, 1.5)
    drawCircleSimple(doc, 232, 58, 1.5)

    // Texto de certificación con mejor espaciado
    doc.setFontSize(14)
    doc.setTextColor(...textColor)
    doc.setFont('helvetica', 'italic')
    doc.text('Este certificado acredita que', 148.5, 72, { align: 'center' })

    // Nombre del estudiante con mejor presentación
    doc.setFontSize(32)
    doc.setTextColor(...primaryColor)
    doc.setFont('helvetica', 'bold')
    
    // Líneas decorativas alrededor del nombre
    doc.setDrawColor(...accentColor)
    doc.setLineWidth(0.5)
    doc.line(40, 85, 257, 85)
    doc.line(40, 105, 257, 105)
    
    doc.text(userName.toUpperCase(), 148.5, 97, { align: 'center', maxWidth: 220 })

    // Texto intermedio
    doc.setFontSize(14)
    doc.setTextColor(...textColor)
    doc.setFont('helvetica', 'italic')
    doc.text('ha completado exitosamente el curso', 148.5, 115, { align: 'center' })

    // Nombre del curso con mejor formato
    doc.setFontSize(22)
    doc.setTextColor(...primaryColor)
    doc.setFont('helvetica', 'bold')
    
    // Fondo sutil para el nombre del curso (rectángulo simple con bordes redondeados simulados)
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(...lightGray)
    doc.setLineWidth(0.5)
    doc.rect(40, 123, 217, 15, 'FD')
    
    doc.text(courseTitle, 148.5, 133, { align: 'center', maxWidth: 210 })

    // Línea de separación decorativa
    doc.setDrawColor(...secondaryColor)
    doc.setLineWidth(1)
    doc.line(50, 145, 100, 145)
    doc.line(197, 145, 247, 145)
    
    // Ornamentos en los extremos
    doc.setFillColor(...accentColor)
    drawCircleSimple(doc, 52, 145, 1.5)
    drawCircleSimple(doc, 98, 145, 1.5)
    drawCircleSimple(doc, 199, 145, 1.5)
    drawCircleSimple(doc, 245, 145, 1.5)

    // Sección de información inferior con mejor diseño
    const infoY = 160
    
    // Fondo para información del instructor
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(0.5)
    doc.rect(30, infoY, 110, 25, 'FD')
    
    // Fondo para información de fecha
    doc.rect(157, infoY, 110, 25, 'FD')

    // Instructor con mejor formato
    doc.setFontSize(11)
    doc.setTextColor(...textColor)
    doc.setFont('helvetica', 'normal')
    doc.text('Instructor del Curso', 85, infoY + 6, { align: 'center' })
    
    doc.setFontSize(13)
    doc.setTextColor(...primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text(instructorName, 85, infoY + 15, { align: 'center', maxWidth: 100 })

    // Fecha con mejor formato
    doc.setFontSize(11)
    doc.setTextColor(...textColor)
    doc.setFont('helvetica', 'normal')
    doc.text('Fecha de Emisión', 212, infoY + 6, { align: 'center' })
    
    doc.setFontSize(13)
    doc.setTextColor(...primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text(issueDate, 212, infoY + 15, { align: 'center', maxWidth: 100 })

    // Líneas decorativas inferiores
    doc.setDrawColor(...accentColor)
    doc.setLineWidth(0.5)
    doc.line(50, 195, 247, 195)
    doc.line(55, 198, 242, 198)

    // Texto de autenticación en la parte inferior
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.text('Este certificado puede ser verificado mediante su código único', 148.5, 202, { align: 'center' })

    // Convertir a Buffer
    const pdfOutput = doc.output('arraybuffer')
    return Buffer.from(pdfOutput)
  }

  /**
   * Crea el registro del certificado en la base de datos
   */
  static async createCertificateRecord(
    userId: string,
    courseId: string,
    enrollmentId: string,
    certificateUrl: string
  ): Promise<string | null> {
    try {
      const supabase = await createClient()

      // Verificar si ya existe un certificado
      const { data: existing } = await supabase
        .from('user_course_certificates')
        .select('certificate_id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single()

      if (existing) {
        logger.log('Certificado ya existe en BD:', existing.certificate_id)
        return existing.certificate_id
      }

      // Crear registro del certificado
      // El hash se generará automáticamente por la función certificate_hash_immutable
      const { data: certificate, error: insertError } = await supabase
        .from('user_course_certificates')
        .insert({
          user_id: userId,
          course_id: courseId,
          enrollment_id: enrollmentId,
          certificate_url: certificateUrl,
          issued_at: new Date().toISOString()
        })
        .select('certificate_id')
        .single()

      if (insertError) {
        logger.error('Error creando registro de certificado:', insertError)
        throw insertError
      }

      logger.log('Registro de certificado creado exitosamente:', certificate.certificate_id)
      return certificate.certificate_id
    } catch (error) {
      logger.error('Error creando registro de certificado:', error)
      return null
    }
  }
}
