/**
 * ✅ CORRECCIÓN 5: Validación Robusta de Uploads
 * Implementa validaciones de seguridad para prevenir:
 * - Path Traversal
 * - Subida de Malware
 * - DoS por archivos grandes
 * - Extension Spoofing
 */

// ✅ Configuración de validación de uploads
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    documents: ['application/pdf', 'text/plain'],
    all: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain']
  },
  allowedExtensions: {
    images: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    documents: ['pdf', 'txt'],
    all: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt']
  },
  bucketWhitelist: ['avatars', 'content-images', 'documents', 'community-images', 'intro-videos']
};

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * ✅ Valida un archivo según tamaño, MIME type y extensión
 */
export function validateFile(
  file: File,
  options: {
    allowedTypes?: string[];
    allowedExtensions?: string[];
    maxSize?: number;
  } = {}
): ValidationResult {
  const {
    allowedTypes = UPLOAD_CONFIG.allowedMimeTypes.all,
    allowedExtensions = UPLOAD_CONFIG.allowedExtensions.all,
    maxSize = UPLOAD_CONFIG.maxFileSize
  } = options;

  // ✅ Validación 1: Tamaño del archivo
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Archivo muy grande. Máximo ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }

  // ✅ Validación 2: MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido: ${file.type}`
    };
  }

  // ✅ Validación 3: Extensión del archivo
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  if (!fileExt || !allowedExtensions.includes(fileExt)) {
    return {
      valid: false,
      error: `Extensión de archivo no permitida: .${fileExt || 'desconocida'}`
    };
  }

  // ✅ Validación 4: MIME type y extensión deben coincidir (previene extension spoofing)
  const mimeToExt: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'application/pdf': ['pdf'],
    'text/plain': ['txt']
  };

  const expectedExts = mimeToExt[file.type] || [];
  if (expectedExts.length > 0 && !expectedExts.includes(fileExt)) {
    return {
      valid: false,
      error: 'La extensión no coincide con el tipo de archivo'
    };
  }

  return { valid: true };
}

/**
 * ✅ Sanitiza un path para prevenir path traversal
 * Remueve: ../, \, caracteres peligrosos
 */
export function sanitizePath(path: string): string {
  if (!path) return '';
  
  return path
    .replace(/\.\./g, '')           // ✅ Remover .. (path traversal)
    .replace(/[\/\\]+/g, '/')       // ✅ Normalizar slashes
    .replace(/^\/+/, '')            // ✅ Remover leading slashes
    .replace(/[^a-zA-Z0-9\/_-]/g, '_') // ✅ Solo caracteres seguros (alfanuméricos, /, _, -)
    .trim();
}

/**
 * ✅ Valida que el bucket esté en la whitelist
 */
export function validateBucket(bucket: string): ValidationResult {
  if (!bucket) {
    return {
      valid: false,
      error: 'Bucket es requerido'
    };
  }

  if (!UPLOAD_CONFIG.bucketWhitelist.includes(bucket)) {
    return {
      valid: false,
      error: `Bucket no permitido: ${bucket}. Permitidos: ${UPLOAD_CONFIG.bucketWhitelist.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * ✅ Genera un nombre de archivo seguro y único
 */
export function generateSafeFileName(originalName: string): string {
  const lastDotIndex = originalName.lastIndexOf('.');
  const rawExtension =
    lastDotIndex > 0 ? originalName.slice(lastDotIndex + 1).toLowerCase() : '';
  const fileExt = rawExtension.replace(/[^a-z0-9]/g, '') || 'bin';
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomString}.${fileExt}`;
}
