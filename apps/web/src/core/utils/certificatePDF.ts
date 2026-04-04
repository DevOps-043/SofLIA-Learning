/**
 * Utilidad para generar PDF desde el componente CertificateDisplay
 * Usa html2canvas para convertir HTML a imagen y luego jsPDF para crear el PDF
 */

type Html2CanvasRenderer = (
  element: HTMLElement,
  options: Record<string, unknown>
) => Promise<HTMLCanvasElement>

interface PdfDocument {
  addImage: (
    imageData: string,
    format: 'PNG',
    x: number,
    y: number,
    width: number,
    height: number,
    alias?: string,
    compression?: 'NONE' | 'FAST' | 'MEDIUM' | 'SLOW'
  ) => void
  save: (fileName: string) => void
}

type PdfConstructor = new (options: {
  orientation: 'portrait' | 'landscape'
  unit: 'mm'
  format: [number, number]
  compress?: boolean
}) => PdfDocument

let html2canvas: Html2CanvasRenderer | null = null
let jsPDF: PdfConstructor | null = null

async function getHtml2Canvas(): Promise<Html2CanvasRenderer> {
  if (!html2canvas) {
    html2canvas = (await import('html2canvas')).default
  }
  return html2canvas
}

async function getJsPDF(): Promise<PdfConstructor> {
  if (!jsPDF) {
    jsPDF = (await import('jspdf')).default
  }
  return jsPDF
}

export async function generateCertificatePDF(
  elementId: string = 'certificate-display',
  fileName: string = 'certificado.pdf'
): Promise<void> {
  try {
    const element = document.getElementById(elementId)
    
    if (!element) {
      throw new Error('No se encontró el elemento del certificado')
    }

    // Obtener html2canvas y jsPDF
    const html2canvasLib = await getHtml2Canvas()
    const jsPDFLib = await getJsPDF()

    // Esperar a que todas las imágenes se carguen completamente
    const images = element.getElementsByTagName('img')
    const imagePromises = Array.from(images).map((img: HTMLImageElement) => {
      if (img.complete) return Promise.resolve()
      return new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.onerror = () => resolve() // Continuar aunque falle
        // Timeout de seguridad
        setTimeout(() => resolve(), 5000)
      })
    })
    await Promise.all(imagePromises)

    // Esperar a que el QR code se renderice (si existe)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Obtener dimensiones exactas del elemento
    // El certificado debe tener 816px x 1056px (8.5" x 11" a 96 DPI)
    const targetWidth = 816 // px
    const targetHeight = 1056 // px

    // Asegurar que el elemento tenga el tamaño correcto temporalmente
    const originalStyle = element.style.cssText
    element.style.width = `${targetWidth}px`
    element.style.height = `${targetHeight}px`
    element.style.position = 'relative'
    element.style.overflow = 'visible'

    // Esperar un momento para que se apliquen los estilos
    await new Promise(resolve => setTimeout(resolve, 200))

    // Configurar opciones para html2canvas - capturar como imagen pura
    const canvas = await html2canvasLib(element, {
      scale: 2, // Resolución suficiente para buena calidad
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      width: targetWidth,
      height: targetHeight,
      windowWidth: targetWidth,
      windowHeight: targetHeight,
      removeContainer: false,
      imageTimeout: 15000,
      foreignObjectRendering: false, // Importante: desactivar para evitar problemas con texto
      onclone: (clonedDoc: Document) => {
        // Asegurar que el elemento clonado tenga el tamaño exacto
        const clonedElement = clonedDoc.getElementById(elementId)
        if (clonedElement) {
          clonedElement.style.width = `${targetWidth}px`
          clonedElement.style.height = `${targetHeight}px`
          clonedElement.style.position = 'relative'
          clonedElement.style.overflow = 'visible'
          clonedElement.style.margin = '0'
          clonedElement.style.padding = '0'
        }
      }
    })

    // Restaurar estilos originales
    element.style.cssText = originalStyle

    // Convertir canvas a imagen PNG de alta calidad
    const imgData = canvas.toDataURL('image/png', 1.0)
    
    // Dimensiones exactas de hoja carta en mm (8.5 x 11 pulgadas = 215.9 x 279.4 mm)
    const pdfWidth = 215.9 // mm
    const pdfHeight = 279.4 // mm

    // Crear PDF con formato carta (8.5 x 11 pulgadas) - SOLO imagen, sin texto
    const pdf = new jsPDFLib({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
      compress: false // Sin compresión para mejor calidad
    })

    // Agregar SOLO la imagen al PDF ocupando todo el espacio (sin texto adicional)
    // La imagen se agrega como bitmap, no como texto
    // Usar dimensiones exactas de hoja carta
    pdf.addImage(
      imgData, 
      'PNG', 
      0, // xOffset - desde el inicio
      0, // yOffset - desde el inicio
      pdfWidth, // Ancho completo de la hoja carta
      pdfHeight, // Alto completo de la hoja carta
      undefined, // alias (no usado)
      'NONE' // Sin compresión para máxima calidad
    )

    // Descargar el PDF (que contiene solo la imagen)
    pdf.save(fileName)
  } catch (error) {
    console.error('Error generando PDF del certificado:', error)
    throw error
  }
}
