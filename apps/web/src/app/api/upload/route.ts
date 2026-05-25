import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { VIDEO_ASSET_CACHE_CONTROL, isStreamableVideoMimeType } from '@/lib/media/video-upload-policy';
import { processStoredVideoForAdaptiveStreaming } from '@/lib/media/server/adaptive-video-transcoding.server';
import { recordSecurityEvent } from '@/lib/security/security-events';
import { sanitizePath, generateSafeFileName } from '@/lib/upload/validation';
import { validateAndPrepareUpload } from '@/lib/upload/validation.server';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';

const DEFAULT_ASSET_CACHE_CONTROL = '3600';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Storage no configurado' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
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
    const sanitizedFolder = folder ? sanitizePath(folder) : '';
    const fileName = generateSafeFileName(file.name, preparedFile.detectedExtension);
    const filePath = sanitizedFolder ? `${sanitizedFolder}/${fileName}` : fileName;

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
    const adaptiveResult = bucket === 'intro-videos'
      ? await processStoredVideoForAdaptiveStreaming({
          bucket,
          contentType: preparedFile.contentType,
          publicUrl: urlData.publicUrl,
          sizeBytes: preparedFile.sizeBytes,
          sourcePath: filePath,
          supabase,
        })
      : null;

    return NextResponse.json({
      success: true,
      adaptive: adaptiveResult,
      url: adaptiveResult?.playbackUrl ?? urlData.publicUrl,
      path: adaptiveResult?.playbackPath ?? filePath,
      sourcePath: filePath,
      sourceUrl: urlData.publicUrl,
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
