import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/features/auth/services/session.service';
import { logger } from '@/lib/utils/logger';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function getErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return null;
  }

  const { status } = error;
  return typeof status === 'number' ? status : null;
}

function getErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return null;
  }

  const { message } = error;
  return typeof message === 'string' ? message : null;
}

/**
 * POST /api/lia/dictation
 * Transcribe audio a texto usando Whisper de OpenAI
 * 
 * Body (FormData):
 * - audio: File (audio file - mp3, wav, m4a, webm, etc.)
 * - language?: string (código de idioma opcional: es, en, pt)
 * 
 * Response:
 * {
 *   text: string,
 *   language?: string,
 *   success: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado', success: false },
        { status: 401 }
      );
    }

    // 2. Verificar que dictation_enabled esté activado
    // (Esto se puede hacer opcionalmente, pero por ahora lo dejamos como verificación)
    
    // 3. Obtener el archivo de audio del FormData
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const language = formData.get('language') as string | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo de audio', success: false },
        { status: 400 }
      );
    }

    // 4. Validar tamaño del archivo (máximo 25MB para Whisper)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo de audio es demasiado grande. Máximo 25MB', success: false },
        { status: 400 }
      );
    }

    // 5. Validar tipo de archivo
    const allowedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/webm',
      'audio/ogg',
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4',
    ];

    if (!allowedTypes.includes(audioFile.type) && !audioFile.name.match(/\.(mp3|wav|webm|ogg|m4a|mp4)$/i)) {
      return NextResponse.json(
        { error: 'Formato de audio no soportado. Use mp3, wav, webm, ogg, m4a o mp4', success: false },
        { status: 400 }
      );
    }

    // 6. Inicializar OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      logger.error('OpenAI API key no configurada');
      return NextResponse.json(
        { error: 'Error de configuración del servidor', success: false },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // 7. Mapear idioma a código de Whisper
    const languageMap: Record<string, string> = {
      'es': 'es',
      'en': 'en',
      'pt': 'pt',
    };

    const whisperLanguage = language && languageMap[language] ? languageMap[language] : undefined;

    // 8. Convertir File a Buffer para Whisper
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 9. Crear File object para OpenAI
    const file = new File([buffer], audioFile.name, { type: audioFile.type });

    // 10. Transcribir con Whisper
    logger.info('Iniciando transcripción con Whisper', {
      userId: user.id,
      fileName: audioFile.name,
      fileSize: audioFile.size,
      fileType: audioFile.type,
      language: whisperLanguage,
    });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: whisperLanguage,
      response_format: 'verbose_json',
    });

    // 11. Retornar resultado
    return NextResponse.json({
      text: transcription.text,
      language: transcription.language || language || 'es',
      duration: transcription.duration,
      success: true,
    });

  } catch (error: unknown) {
    logger.error('Error en transcripción de dictado:', error);

    // Manejar errores específicos de OpenAI
    if (getErrorStatus(error) === 401) {
      return NextResponse.json(
        { error: 'Error de autenticación con el servicio de transcripción', success: false },
        { status: 500 }
      );
    }

    if (getErrorStatus(error) === 413 || getErrorMessage(error)?.includes('too large')) {
      return NextResponse.json(
        { error: 'El archivo de audio es demasiado grande', success: false },
        { status: 400 }
      );
    }

    if (getErrorMessage(error)?.includes('Invalid file format')) {
      return NextResponse.json(
        { error: 'Formato de audio no válido', success: false },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Error al transcribir audio',
        message: getErrorMessage(error) || 'Error desconocido',
        success: false 
      },
      { status: 500 }
    );
  }
}
