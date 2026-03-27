import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';
import { 
  validateFile, 
  sanitizePath, 
  validateBucket, 
  generateSafeFileName,
  UPLOAD_CONFIG 
} from '@/lib/upload/validation';

export async function POST(request: NextRequest) {
  try {
    // Cliente con service role key para bypass de RLS (dentro de la función para evitar error en build)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const folder = formData.get('folder') as string || '';

    // ✅ Validación 1: Archivo presente
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // ✅ Validación 2: Bucket presente
    if (!bucket) {
      return NextResponse.json({ error: 'No se proporcionó bucket' }, { status: 400 });
    }

    // Validar tamaño y tipo según el bucket
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    // Validaciones específicas para el bucket "courses" (solo imágenes, 8MB)
    if (bucket === 'courses') {
      const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (!allowedImageTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'El bucket "courses" solo acepta imágenes (PNG, JPEG, JPG, GIF)' },
          { status: 400 }
        );
      }
      const maxSize = 8 * 1024 * 1024; // 8MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'El archivo es demasiado grande. Máximo 8MB para el bucket "courses"' },
          { status: 400 }
        );
      }
    } else {
      // Validación para otros buckets
      const maxSize = isVideo ? 500 * 1024 * 1024 : 10 * 1024 * 1024; // 500MB para videos, 10MB para otros
      if (file.size > maxSize) {
        return NextResponse.json(
          { 
            error: `El archivo es demasiado grande. Máximo ${isVideo ? '500MB' : '10MB'}` 
          }, 
          { status: 400 }
        );
      }
    }

    // Sanitizar el folder si existe
    const sanitizedFolder = folder ? sanitizePath(folder) : '';
    
    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = generateSafeFileName(file.name, fileExt || '');
    const filePath = sanitizedFolder ? `${sanitizedFolder}/${fileName}` : fileName;

    // Subir archivo usando service role key
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      logger.error('Error uploading file to Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ✅ Log de seguridad: Upload completado
    logger.info('File uploaded successfully', {
      fileName: fileName,
      filePath: filePath,
      bucket: bucket
    });

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      name: file.name,
      size: file.size,
      type: file.type,
      // ✅ Información adicional de seguridad
      validation: {
        sanitized: sanitizedFolder !== folder,
        bucket: bucket,
        maxSizeAllowed: bucket === 'courses' ? '8MB' : (isVideo ? '500MB' : '10MB')
      }
    });

  } catch (error) {
    logger.error('Error in upload API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}

