import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { createAdminClient } from '@/lib/supabase/admin';
import { VIDEO_ASSET_CACHE_CONTROL, isStreamableVideoMimeType } from '@/lib/media/video-upload-policy';
import { recordSecurityEvent } from '@/lib/security/security-events';
import { sanitizePath, generateSafeFileName } from '@/lib/upload/validation';
import { validateAndPrepareUpload } from '@/lib/upload/validation.server';
import { logger } from '@/lib/utils/logger';
import {
  authorizeGenericUpload,
  buildUserScopedUploadFolder,
  GENERIC_UPLOAD_MAX_REQUEST_BYTES,
} from '@/lib/upload/upload-authorization';

export const runtime = 'nodejs';

const DEFAULT_ASSET_CACHE_CONTROL = '3600';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth;

    const contentLength = Number(request.headers.get('content-length'));
    if (
      !Number.isFinite(contentLength) ||
      contentLength <= 0 ||
      contentLength > GENERIC_UPLOAD_MAX_REQUEST_BYTES
    ) {
      return NextResponse.json(
        { error: 'PAYLOAD_SIZE_NOT_ALLOWED' },
        { status: 413 },
      );
    }

    const supabase = createAdminClient();
    const formData = await request.formData();
    const fileValue = formData.get('file');
    const bucketValue = formData.get('bucket');
    const folderValue = formData.get('folder');
    const file = fileValue instanceof File ? fileValue : null;
    const bucket = typeof bucketValue === 'string' ? bucketValue : '';
    const folder = typeof folderValue === 'string' ? folderValue : '';

    if (!file) {
      return NextResponse.json({ error: 'No se proporciono archivo' }, { status: 400 });
    }

    if (!bucket) {
      return NextResponse.json({ error: 'No se proporciono bucket' }, { status: 400 });
    }

    const authorization = authorizeGenericUpload({
      bucket,
      userRole: auth.userRole,
    });
    if (!authorization.allowed) {
      recordSecurityEvent('file-upload-rejected', {
        pathname: request.nextUrl.pathname,
        method: request.method,
        resourceType: 'storage_bucket',
        resourceId: bucket,
        metadata: {
          reason: authorization.code,
          userId: auth.userId,
        },
      });
      return NextResponse.json(
        { error: authorization.code },
        { status: authorization.code === 'DEDICATED_UPLOAD_REQUIRED' ? 409 : 403 },
      );
    }

    const uploadValidation = await validateAndPrepareUpload(file, bucket);
    if (!uploadValidation.valid || !uploadValidation.file || !uploadValidation.policy) {
      recordSecurityEvent('file-upload-rejected', {
        pathname: request.nextUrl.pathname,
        method: request.method,
        ip: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        resourceType: 'storage_bucket',
        resourceId: bucket,
        metadata: {
          reason: uploadValidation.error,
          fileSize: file.size,
          declaredType: file.type,
          antimalwareRequired: uploadValidation.antimalwareRequired,
        },
      });

      return NextResponse.json(
        { error: uploadValidation.error || 'Archivo no permitido' },
        { status: uploadValidation.antimalwareRequired ? 503 : 400 },
      );
    }

    const preparedFile = uploadValidation.file;
    const sanitizedFolder = buildUserScopedUploadFolder(
      auth.userId,
      folder ? sanitizePath(folder) : '',
    );
    const fileName = generateSafeFileName(file.name, preparedFile.detectedExtension);
    const filePath = `${sanitizedFolder}/${fileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, preparedFile.body, {
        cacheControl: isStreamableVideoMimeType(preparedFile.contentType)
          ? VIDEO_ASSET_CACHE_CONTROL
          : DEFAULT_ASSET_CACHE_CONTROL,
        contentType: preparedFile.contentType,
        upsert: false,
      });

    if (error) {
      logger.error('Error uploading file to Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.info('File uploaded successfully', {
      fileName,
      filePath,
      bucket,
      contentType: preparedFile.contentType,
      reencoded: preparedFile.reencoded,
    });

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      sourcePath: filePath,
      name: file.name,
      size: preparedFile.sizeBytes,
      type: preparedFile.contentType,
      validation: {
        bucket,
        detectedMime: preparedFile.detectedMime,
        maxSizeAllowed: `${Math.round(uploadValidation.policy.maxSizeBytes / 1024 / 1024)}MB`,
        reencoded: preparedFile.reencoded,
        sanitized: sanitizedFolder !== folder,
      },
    });
  } catch (error) {
    logger.error('Error in upload API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
