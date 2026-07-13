const MB = 1024 * 1024;
const GB = 1024 * MB;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface UploadBucketPolicy {
  allowedMimeTypes: readonly string[];
  allowedExtensions: readonly string[];
  maxSizeBytes: number;
  requiresAntimalware?: boolean;
  reencodeImages?: boolean;
}

export const BUCKET_UPLOAD_POLICIES = {
  avatars: {
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    allowedExtensions: ['png', 'jpg', 'jpeg', 'webp'],
    maxSizeBytes: 2 * MB,
    reencodeImages: true,
  },
  'content-images': {
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    allowedExtensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
    maxSizeBytes: 5 * MB,
    reencodeImages: true,
  },
  documents: {
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    allowedExtensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
    maxSizeBytes: 10 * MB,
    requiresAntimalware: true,
  },
  'community-images': {
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    allowedExtensions: ['png', 'jpg', 'jpeg', 'webp'],
    maxSizeBytes: 5 * MB,
    reencodeImages: true,
  },
  'intro-videos': {
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    allowedExtensions: ['mp4', 'webm', 'ogg', 'mov'],
    maxSizeBytes: 500 * MB,
  },
  'course-videos': {
    allowedMimeTypes: ['video/mp4', 'video/webm'],
    allowedExtensions: ['mp4', 'webm'],
    maxSizeBytes: 2 * GB,
  },
  courses: {
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    allowedExtensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
    maxSizeBytes: 8 * MB,
    reencodeImages: true,
  },
  // Branding de la organización (logo, favicon, banner) subido desde el panel
  // de negocio. SVG queda fuera a propósito: puede transportar scripts.
  'Panel-Business': {
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    allowedExtensions: ['png', 'jpg', 'jpeg', 'webp'],
    maxSizeBytes: 5 * MB,
    reencodeImages: true,
  },
} as const satisfies Record<string, UploadBucketPolicy>;

export const UPLOAD_CONFIG = {
  maxFileSize: 10 * MB,
  allowedMimeTypes: {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    documents: ['application/pdf', 'text/plain'],
    all: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'],
  },
  allowedExtensions: {
    images: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    documents: ['pdf', 'txt'],
    all: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt'],
  },
  bucketWhitelist: Object.keys(BUCKET_UPLOAD_POLICIES),
};

export function validateFile(
  file: File,
  options: {
    allowedTypes?: string[];
    allowedExtensions?: string[];
    maxSize?: number;
  } = {},
): ValidationResult {
  const {
    allowedTypes = UPLOAD_CONFIG.allowedMimeTypes.all,
    allowedExtensions = UPLOAD_CONFIG.allowedExtensions.all,
    maxSize = UPLOAD_CONFIG.maxFileSize,
  } = options;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Archivo muy grande. Maximo ${Math.round(maxSize / MB)}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido: ${file.type}`,
    };
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase();
  if (!fileExt || !allowedExtensions.includes(fileExt)) {
    return {
      valid: false,
      error: `Extension de archivo no permitida: .${fileExt || 'desconocida'}`,
    };
  }

  const mimeToExt: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'application/pdf': ['pdf'],
    'text/plain': ['txt'],
  };

  const expectedExts = mimeToExt[file.type] || [];
  if (expectedExts.length > 0 && !expectedExts.includes(fileExt)) {
    return {
      valid: false,
      error: 'La extension no coincide con el tipo de archivo',
    };
  }

  return { valid: true };
}

export function sanitizePath(path: string): string {
  if (!path) return '';

  return path
    .replace(/\.\./g, '')
    .replace(/[\/\\]+/g, '/')
    .replace(/^\/+/, '')
    .replace(/[^a-zA-Z0-9\/_-]/g, '_')
    .trim();
}

export function validateBucket(bucket: string): ValidationResult {
  if (!bucket) {
    return {
      valid: false,
      error: 'Bucket es requerido',
    };
  }

  if (!UPLOAD_CONFIG.bucketWhitelist.includes(bucket)) {
    return {
      valid: false,
      error: `Bucket no permitido: ${bucket}. Permitidos: ${UPLOAD_CONFIG.bucketWhitelist.join(', ')}`,
    };
  }

  return { valid: true };
}

export function generateSafeFileName(originalName: string, extensionOverride?: string): string {
  const lastDotIndex = originalName.lastIndexOf('.');
  const rawExtension = extensionOverride
    || (lastDotIndex > 0 ? originalName.slice(lastDotIndex + 1).toLowerCase() : '');
  const fileExt = rawExtension.replace(/[^a-z0-9]/g, '') || 'bin';
  const fileId =
    globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${fileId}.${fileExt}`;
}

export function getUploadBucketPolicy(bucket: string): UploadBucketPolicy | null {
  return BUCKET_UPLOAD_POLICIES[bucket as keyof typeof BUCKET_UPLOAD_POLICIES] ?? null;
}
