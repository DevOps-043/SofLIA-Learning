export const GENERIC_UPLOAD_MAX_REQUEST_BYTES = 12 * 1024 * 1024

const AUTHENTICATED_BUCKETS = new Set([
  'avatars',
  'community-images',
])

const CONTENT_MANAGER_BUCKETS = new Set([
  'content-images',
  'courses',
  'documents',
])

const BUSINESS_ADMIN_BUCKETS = new Set(['Panel-Business'])

const DEDICATED_UPLOAD_BUCKETS = new Set([
  'course-videos',
  'intro-videos',
])

export interface UploadAuthorizationInput {
  bucket: string
  userRole: string
}

export type UploadAuthorizationResult =
  | { allowed: true }
  | { allowed: false; code: 'BUCKET_FORBIDDEN' | 'DEDICATED_UPLOAD_REQUIRED' }

export function authorizeGenericUpload({
  bucket,
  userRole,
}: UploadAuthorizationInput): UploadAuthorizationResult {
  if (DEDICATED_UPLOAD_BUCKETS.has(bucket)) {
    return { allowed: false, code: 'DEDICATED_UPLOAD_REQUIRED' }
  }

  if (AUTHENTICATED_BUCKETS.has(bucket)) {
    return { allowed: true }
  }

  if (CONTENT_MANAGER_BUCKETS.has(bucket)) {
    return userRole === 'Administrador' || userRole === 'Instructor'
      ? { allowed: true }
      : { allowed: false, code: 'BUCKET_FORBIDDEN' }
  }

  if (BUSINESS_ADMIN_BUCKETS.has(bucket)) {
    return userRole === 'Administrador' || userRole === 'Business'
      ? { allowed: true }
      : { allowed: false, code: 'BUCKET_FORBIDDEN' }
  }

  return { allowed: false, code: 'BUCKET_FORBIDDEN' }
}

export function buildUserScopedUploadFolder(
  userId: string,
  requestedFolder: string,
): string {
  const normalizedFolder = requestedFolder.replace(/^\/+|\/+$/g, '')
  return normalizedFolder
    ? `users/${userId}/${normalizedFolder}`
    : `users/${userId}`
}
