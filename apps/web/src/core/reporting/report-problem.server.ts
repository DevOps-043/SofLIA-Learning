import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Json } from '../../lib/supabase/types';
import { REPORT_PROBLEM_MAX_IMAGE_SIZE_BYTES } from './report-problem.contract';
import type {
  LiaImageAttachment,
  ReportProblemClientMetadata,
  ReportProblemCourseContext,
  ReportProblemLiaMetadata,
  ReportProblemMetadata,
  ReportProblemOriginContext,
  ReportProblemSource,
  UploadedReportAttachment,
} from './report-problem.contract';

export const REPORT_PROBLEM_STORAGE_BUCKET = 'reportes-screenshots';

const REPORT_PROBLEM_ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]);

interface UploadReportAttachmentsResult {
  assets: UploadedReportAttachment[];
  warnings: string[];
  primaryScreenshotUrl: string | null;
}

interface BuildReportProblemMetadataInput {
  source: ReportProblemSource;
  fromLia: boolean;
  reportedAt?: string;
  originContext: ReportProblemOriginContext;
  courseContext?: ReportProblemCourseContext | null;
  attachments?: UploadedReportAttachment[];
  attachmentUploadWarnings?: string[];
  liaContext?: ReportProblemLiaMetadata;
  clientContext?: ReportProblemClientMetadata;
}

interface DataUrlPayload {
  mimeType: string;
  base64Data: string;
}

function parseImageDataUrl(dataUrl: string): DataUrlPayload | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    return null;
  }

  return {
    mimeType: match[1].toLowerCase(),
    base64Data: match[2],
  };
}

function getAttachmentFileExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/gif':
      return 'gif';
    case 'image/webp':
      return 'webp';
    case 'image/jpeg':
    case 'image/jpg':
    default:
      return 'jpg';
  }
}

function sanitizeFileSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function buildStorageFileName(
  userId: string,
  attachment: LiaImageAttachment,
  index: number
): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).slice(2, 8);
  const safeUserId = sanitizeFileSegment(userId) || 'user';
  const safeName = sanitizeFileSegment(attachment.fileName) || `attachment-${index + 1}`;
  const extension = getAttachmentFileExtension(attachment.mimeType);

  return `report-${safeUserId}-${timestamp}-${index + 1}-${safeName}-${randomId}.${extension}`;
}

async function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Configuración incompleta de Supabase para reportes');
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function validateImageAttachment(attachment: LiaImageAttachment): string | null {
  if (attachment.kind !== 'image') {
    return `El adjunto "${attachment.fileName}" no es una imagen válida`;
  }

  if (!REPORT_PROBLEM_ALLOWED_IMAGE_MIME_TYPES.has(attachment.mimeType.toLowerCase())) {
    return `El tipo de archivo "${attachment.mimeType}" no está permitido`;
  }

  if (attachment.size <= 0 || attachment.size > REPORT_PROBLEM_MAX_IMAGE_SIZE_BYTES) {
    return `La imagen "${attachment.fileName}" excede el tamaño máximo permitido de 10MB`;
  }

  const parsedDataUrl = parseImageDataUrl(attachment.dataUrl);
  if (!parsedDataUrl) {
    return `La imagen "${attachment.fileName}" no tiene un formato Data URL válido`;
  }

  if (parsedDataUrl.mimeType !== attachment.mimeType.toLowerCase()) {
    return `La imagen "${attachment.fileName}" tiene un MIME inconsistente`;
  }

  return null;
}

export function buildLegacyScreenshotAttachment(
  screenshotData: string,
  fileName: string = 'captura-reporte.jpg'
): LiaImageAttachment | null {
  const parsedData = parseImageDataUrl(screenshotData);

  if (!parsedData) {
    return null;
  }

  const estimatedSize = Math.floor((parsedData.base64Data.length * 3) / 4);

  return {
    kind: 'image',
    dataUrl: screenshotData,
    fileName,
    mimeType: parsedData.mimeType,
    size: estimatedSize,
  };
}

export async function uploadReportImageAttachments(
  attachments: LiaImageAttachment[],
  userId: string
): Promise<UploadReportAttachmentsResult> {
  if (attachments.length === 0) {
    return {
      assets: [],
      warnings: [],
      primaryScreenshotUrl: null,
    };
  }

  const assets: UploadedReportAttachment[] = [];
  const warnings: string[] = [];
  let supabaseAdmin: Awaited<ReturnType<typeof createSupabaseAdminClient>>;

  try {
    supabaseAdmin = await createSupabaseAdminClient();
  } catch (error) {
    return {
      assets: [],
      warnings: [
        error instanceof Error
          ? error.message
          : 'No fue posible inicializar el storage de reportes',
      ],
      primaryScreenshotUrl: null,
    };
  }

  for (const [index, attachment] of attachments.entries()) {
    const validationError = validateImageAttachment(attachment);

    if (validationError) {
      warnings.push(validationError);
      continue;
    }

    const parsedData = parseImageDataUrl(attachment.dataUrl);

    if (!parsedData) {
      warnings.push(`No se pudo procesar la imagen "${attachment.fileName}"`);
      continue;
    }

    try {
      const buffer = Buffer.from(parsedData.base64Data, 'base64');
      const fileName = buildStorageFileName(userId, attachment, index);

      const { data, error } = await supabaseAdmin.storage
        .from(REPORT_PROBLEM_STORAGE_BUCKET)
        .upload(fileName, buffer, {
          contentType: parsedData.mimeType,
          cacheControl: '3600',
          upsert: false,
        });

      if (error || !data) {
        warnings.push(
          `No se pudo subir la imagen "${attachment.fileName}" a storage`
        );
        continue;
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(REPORT_PROBLEM_STORAGE_BUCKET)
        .getPublicUrl(data.path);

      assets.push({
        kind: 'image',
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        size: attachment.size,
        width: attachment.width ?? null,
        height: attachment.height ?? null,
        publicUrl: publicUrlData.publicUrl,
        storagePath: data.path,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido al subir imagen';
      warnings.push(
        `Falló la subida de "${attachment.fileName}": ${errorMessage}`
      );
    }
  }

  return {
    assets,
    warnings,
    primaryScreenshotUrl: assets[0]?.publicUrl ?? null,
  };
}

export function buildReportProblemMetadata({
  source,
  fromLia,
  reportedAt = new Date().toISOString(),
  originContext,
  courseContext,
  attachments = [],
  attachmentUploadWarnings = [],
  liaContext,
  clientContext,
}: BuildReportProblemMetadataInput): ReportProblemMetadata {
  return {
    source,
    fromLia,
    reportedAt,
    originContext,
    courseContext: courseContext ?? null,
    attachments,
    attachmentUploadWarnings,
    irisSync: {
      externalSystem: 'IRIS',
      status: 'pending',
    },
    liaContext,
    clientContext,
  };
}

export function serializeReportProblemMetadata(
  metadata: ReportProblemMetadata
): Json {
  return JSON.parse(JSON.stringify(metadata)) as Json;
}

export function toInlineImagePart(attachment: LiaImageAttachment): {
  inlineData: {
    mimeType: string;
    data: string;
  };
} | null {
  const validationError = validateImageAttachment(attachment);

  if (validationError) {
    return null;
  }

  const parsedData = parseImageDataUrl(attachment.dataUrl);

  if (!parsedData) {
    return null;
  }

  return {
    inlineData: {
      mimeType: parsedData.mimeType,
      data: parsedData.base64Data,
    },
  };
}
