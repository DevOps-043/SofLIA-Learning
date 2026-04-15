import { getFullUrl } from '@/lib/env'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  CERTIFICATE_RENDER_HEIGHT_PX,
  CERTIFICATE_RENDER_WIDTH_PX,
} from '@/features/certificates/constants/certificate-branding'

interface PlaywrightResponse {
  ok: () => boolean
  status: () => number
  statusText: () => string
}

interface PlaywrightPage {
  goto: (
    url: string,
    options: {
      waitUntil: 'domcontentloaded' | 'load' | 'networkidle'
      timeout?: number
    },
  ) => Promise<PlaywrightResponse | null>
  setContent: (
    html: string,
    options: {
      waitUntil?: 'domcontentloaded' | 'load' | 'networkidle'
      timeout?: number
    },
  ) => Promise<void>
  waitForSelector: (selector: string, options?: { timeout?: number }) => Promise<void>
  emulateMedia: (options: { media: 'screen' | 'print' }) => Promise<void>
  pdf: (options: {
    printBackground: boolean
    width?: string
    height?: string
    format?: string
    landscape?: boolean
    margin: { top: string; right: string; bottom: string; left: string }
    preferCSSPageSize: boolean
  }) => Promise<Buffer>
}

interface PlaywrightBrowserContext {
  newPage: () => Promise<PlaywrightPage>
  close: () => Promise<void>
}

interface PlaywrightBrowser {
  newContext: (options?: {
    extraHTTPHeaders?: Record<string, string>
    viewport?: { width: number; height: number }
  }) => Promise<PlaywrightBrowserContext>
  close: () => Promise<void>
}

interface PlaywrightModule {
  chromium: {
    launch: (options: { headless: boolean; args?: string[] }) => Promise<PlaywrightBrowser>
  }
}

async function loadPlaywrightModule(): Promise<PlaywrightModule> {
  try {
    return (await import('playwright')) as unknown as PlaywrightModule
  } catch {
    return (await import('@playwright/test')) as unknown as PlaywrightModule
  }
}

export class CertificatePdfService {
  static buildStoragePath(userId: string, certificateId: string): string {
    return `${userId}/${certificateId}.pdf`
  }

  static async buildPublicUrl(filePath: string): Promise<string> {
    const supabase = createAdminClient()
    const { data } = supabase.storage.from('certificates').getPublicUrl(filePath)
    return data.publicUrl
  }

  static async renderPdfBuffer(params: {
    userId: string
    certificateId: string
    cookieHeader?: string | null
  }): Promise<Buffer> {
    const playwright = await loadPlaywrightModule()
    const browser = await playwright.chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })

    try {
      const context = await browser.newContext({
        extraHTTPHeaders: params.cookieHeader
          ? {
              Cookie: params.cookieHeader,
            }
          : undefined,
        viewport: {
          width: CERTIFICATE_RENDER_WIDTH_PX,
          height: CERTIFICATE_RENDER_HEIGHT_PX,
        },
      })

      try {
        const page = await context.newPage()
        const printUrl = getFullUrl(`/certificates/${params.certificateId}/print`)
        const response = await page.goto(printUrl, {
          waitUntil: 'load',
          timeout: 45000,
        })

        if (!response || !response.ok()) {
          throw new Error(
            `No se pudo abrir la vista imprimible del certificado (${response?.status() || 0} ${response?.statusText() || 'sin respuesta'})`,
          )
        }

        await page.waitForSelector('[data-certificate-print-ready="true"]', {
          timeout: 45000,
        })
        await page.waitForSelector('[data-certificate-root="true"]', {
          timeout: 45000,
        })
        await page.emulateMedia({ media: 'print' })

        return page.pdf({
          printBackground: true,
          format: 'A4',
          landscape: true,
          margin: {
            top: '0mm',
            right: '0mm',
            bottom: '0mm',
            left: '0mm',
          },
          preferCSSPageSize: true,
        })
      } finally {
        await context.close()
      }
    } finally {
      await browser.close()
    }
  }

  static async uploadPdf(params: {
    userId: string
    certificateId: string
    buffer: Buffer
  }): Promise<string> {
    const supabase = createAdminClient()
    const filePath = this.buildStoragePath(params.userId, params.certificateId)

    const { error } = await supabase.storage.from('certificates').upload(filePath, params.buffer, {
      upsert: true,
      contentType: 'application/pdf',
      cacheControl: '3600',
    })

    if (error) {
      throw error
    }

    return this.buildPublicUrl(filePath)
  }

  static async downloadStoredPdf(params: {
    userId: string
    certificateId: string
  }): Promise<Buffer | null> {
    const supabase = createAdminClient()
    const filePath = this.buildStoragePath(params.userId, params.certificateId)
    const { data, error } = await supabase.storage.from('certificates').download(filePath)

    if (error || !data) {
      return null
    }

    const arrayBuffer = await data.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  static async ensureStoredPdf(params: {
    userId: string
    certificateId: string
    cookieHeader?: string | null
    forceRegenerate?: boolean
  }): Promise<{
    buffer: Buffer
    publicUrl: string
  }> {
    const filePath = this.buildStoragePath(params.userId, params.certificateId)

    if (!params.forceRegenerate) {
      const existingBuffer = await this.downloadStoredPdf({
        userId: params.userId,
        certificateId: params.certificateId,
      })

      if (existingBuffer) {
        return {
          buffer: existingBuffer,
          publicUrl: await this.buildPublicUrl(filePath),
        }
      }
    }

    const buffer = await this.renderPdfBuffer({
      userId: params.userId,
      certificateId: params.certificateId,
      cookieHeader: params.cookieHeader,
    })

    const publicUrl = await this.uploadPdf({
      userId: params.userId,
      certificateId: params.certificateId,
      buffer,
    })

    return {
      buffer,
      publicUrl,
    }
  }
}
