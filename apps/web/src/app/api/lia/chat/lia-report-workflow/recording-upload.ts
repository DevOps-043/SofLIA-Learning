import { createSupabaseAdminClient } from './admin-client';

export async function uploadSessionRecording(
  sessionSnapshot: string,
  userId: string
): Promise<string | null> {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const isCompressed = sessionSnapshot.startsWith('gzip:');
    const buffer = isCompressed
      ? Buffer.from(sessionSnapshot.slice(5), 'base64')
      : Buffer.from(sessionSnapshot, 'utf-8');
    const extension = isCompressed ? 'json.gz' : 'json';
    const contentType = isCompressed ? 'application/gzip' : 'application/json';
    const fileName = `recording-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extension}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('reportes-screenshots')
      .upload(fileName, buffer, { contentType, cacheControl: '3600', upsert: false });

    if (uploadError || !uploadData) {
      console.error('Error subiendo la grabacion del reporte:', uploadError);
      return null;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('reportes-screenshots')
      .getPublicUrl(uploadData.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error procesando la grabacion del reporte:', error);
    return null;
  }
}
