import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import {
  getUploadBucketPolicy,
  validateBucket,
  type UploadBucketPolicy,
} from './validation';
import { scanUploadForMalware } from './antimalware.server';

export interface PreparedUploadFile {
  body: File | Buffer;
  contentType: string;
  detectedExtension: string;
  detectedMime: string;
  reencoded: boolean;
  sizeBytes: number;
}

export interface ServerUploadValidationResult {
  valid: boolean;
  error?: string;
  file?: PreparedUploadFile;
  policy?: UploadBucketPolicy;
  antimalwareRequired?: boolean;
}

const SIGNATURE_READ_BYTES = 8 * 1024;
const IMAGE_OUTPUT_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export async function validateAndPrepareUpload(
  file: File,
  bucket: string,
): Promise<ServerUploadValidationResult> {
  const bucketValidation = validateBucket(bucket);
  if (!bucketValidation.valid) {
    return { valid: false, error: bucketValidation.error };
  }

  const policy = getUploadBucketPolicy(bucket);
  if (!policy) {
    return { valid: false, error: 'Politica de upload no configurada' };
  }

  if (file.size > policy.maxSizeBytes) {
    return {
      valid: false,
      error: `Archivo muy grande. Maximo ${Math.round(policy.maxSizeBytes / 1024 / 1024)}MB`,
    };
  }

  const detected = await detectFileType(file);
  if (!detected) {
    return { valid: false, error: 'No se pudo verificar la firma real del archivo' };
  }

  if (!policy.allowedMimeTypes.includes(detected.mime)) {
    return {
      valid: false,
      error: `Firma de archivo no permitida: ${detected.mime}`,
    };
  }

  if (!policy.allowedExtensions.includes(detected.ext)) {
    return {
      valid: false,
      error: `Extension detectada no permitida: .${detected.ext}`,
    };
  }

  if (policy.requiresAntimalware && !isAntimalwareBypassEnabled()) {
    const scan = await scanUploadForMalware(file, {
      bucket,
      detectedMime: detected.mime,
    });

    if (scan.status === 'infected') {
      return {
        valid: false,
        error: scan.signature
          ? `Archivo rechazado por antimalware: ${scan.signature}`
          : 'Archivo rechazado por antimalware',
        policy,
      };
    }

    if (scan.status !== 'clean') {
      return {
        valid: false,
        error: 'Este bucket requiere escaneo antimalware antes de aceptar archivos',
        policy,
        antimalwareRequired: true,
      };
    }
  }

  const prepared = policy.reencodeImages && IMAGE_OUTPUT_TYPES.has(detected.mime)
    ? await reencodeImage(file, detected.mime, detected.ext)
    : {
        body: file,
        contentType: detected.mime,
        detectedExtension: detected.ext,
        detectedMime: detected.mime,
        reencoded: false,
        sizeBytes: file.size,
      };

  return { valid: true, file: prepared, policy };
}

async function detectFileType(file: File) {
  const bytes = new Uint8Array(await file.slice(0, SIGNATURE_READ_BYTES).arrayBuffer());
  try {
    return await fileTypeFromBuffer(bytes);
  } catch {
    return undefined;
  }
}

async function reencodeImage(
  file: File,
  detectedMime: string,
  detectedExtension: string,
): Promise<PreparedUploadFile> {
  const source = Buffer.from(await file.arrayBuffer());
  const image = sharp(source, { failOn: 'warning' }).rotate();
  const body = detectedMime === 'image/png'
    ? await image.png().toBuffer()
    : detectedMime === 'image/webp'
      ? await image.webp().toBuffer()
      : await image.jpeg({ mozjpeg: true }).toBuffer();

  return {
    body,
    contentType: detectedMime,
    detectedExtension,
    detectedMime,
    reencoded: true,
    sizeBytes: body.byteLength,
  };
}

function isAntimalwareBypassEnabled() {
  return process.env.UPLOAD_ANTIMALWARE_MODE === 'bypass-local';
}
