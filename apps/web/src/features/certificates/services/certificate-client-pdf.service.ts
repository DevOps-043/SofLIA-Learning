'use client'

import {
  CERTIFICATE_RENDER_HEIGHT_PX,
  CERTIFICATE_RENDER_WIDTH_PX,
} from '@/features/certificates/constants/certificate-branding'

interface DownloadCertificatePdfParams {
  element: HTMLElement
  fileName: string
}

async function waitForDocumentAssets(element: HTMLElement): Promise<void> {
  const fontReady = document.fonts?.ready.catch(() => undefined) ?? Promise.resolve()
  const images = Array.from(element.querySelectorAll('img'))

  await Promise.all([
    fontReady,
    ...images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve()
            return
          }

          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener('error', () => resolve(), { once: true })
        }),
    ),
  ])
}

export async function downloadCertificatePdf({
  element,
  fileName,
}: DownloadCertificatePdfParams): Promise<void> {
  // Usamos `html2canvas-pro` (fork mantenido) en vez de `html2canvas@1.4.1`, que
  // esta sin mantenimiento y tiene bugs conocidos de renderizado de texto: el
  // baseline se desplaza hacia abajo (el texto se "desacopla" de sus lineas) y los
  // espacios/letras se colapsan. El fork corrige esto y conserva la misma API +
  // `useCORS` para los logos remotos.
  const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ])

  await waitForDocumentAssets(element)

  const canvas = await html2canvas(element, {
    backgroundColor: null,
    logging: false,
    scale: 2,
    useCORS: true,
    width: CERTIFICATE_RENDER_WIDTH_PX,
    height: CERTIFICATE_RENDER_HEIGHT_PX,
    windowWidth: CERTIFICATE_RENDER_WIDTH_PX,
    windowHeight: CERTIFICATE_RENDER_HEIGHT_PX,
  })

  const imageData = canvas.toDataURL('image/png')
  const pdf = new JsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [CERTIFICATE_RENDER_WIDTH_PX, CERTIFICATE_RENDER_HEIGHT_PX],
    compress: true,
  })

  pdf.addImage(
    imageData,
    'PNG',
    0,
    0,
    CERTIFICATE_RENDER_WIDTH_PX,
    CERTIFICATE_RENDER_HEIGHT_PX,
    undefined,
    'FAST',
  )
  pdf.save(fileName)
}
