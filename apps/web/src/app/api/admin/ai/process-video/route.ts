import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import os from 'os';
import { requireAdmin } from '@/lib/auth/requireAdmin'
import {
  CIRCUIT_BREAKER_DEFAULTS,
  executeWithCircuitBreaker,
} from '@/lib/resilience/circuit-breaker'
import { getSafeFetchSupabaseHosts, safeFetch } from '@/lib/security/safe-fetch';

export const runtime = 'nodejs'; // Required for file system operations
export const maxDuration = 300; // 5 minutes max for processing

export async function POST(req: NextRequest) {
  // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Se requiere la URL del video' },
        { status: 400 }
      );
    }

    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY no configurada' },
        { status: 500 }
      );
    }


    // 1. Descargar el video temporalmente
    const tempDir = os.tmpdir();
    const fileName = `temp-video-${Date.now()}.mp4`;
    const filePath = join(tempDir, fileName);

    
    const videoResponse = await safeFetch(videoUrl, { cache: 'no-store' }, {
      allowedHosts: getSafeFetchSupabaseHosts(),
      provider: 'external-video-download',
      requireHostAllowlist: true,
    });
    if (!videoResponse.ok) {
      throw new Error(`Error al descargar video: ${videoResponse.statusText}`);
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    await writeFile(filePath, Buffer.from(videoBuffer));

    // 2. Subir a Gemini File API
    const fileManager = new GoogleAIFileManager(googleApiKey);
    
    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType: 'video/mp4',
      displayName: 'Lesson Video',
    });

    const fileUri = uploadResult.file.uri;
    const uploadName = uploadResult.file.name;

    // 3. Esperar a que se procese
    let file = await fileManager.getFile(uploadName);
    while (file.state === FileState.PROCESSING) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Esperar 2s
      file = await fileManager.getFile(uploadName);
    }

    if (file.state === FileState.FAILED) {
      throw new Error('El procesamiento del video en Gemini falló.');
    }


    // 4. Generar Transcripción y Resumen
    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      Actúa como un asistente educativo experto encargado de procesar material didáctico.
      
      Analiza el video y la pista de audio proporcionada EXHAUSTIVAMENTE.
      
      Debes generar un objeto JSON con dos campos obligatorios:
      
      1. "transcript": La transcripción COMPLETA de todo lo que se dice en el video.
         - IMPORTANTE: No devuelvas un solo bloque masivo de texto.
         - Divide el texto en párrafos lógicos y legibles usando doble salto de línea (\\n\\n).
         - La lectura debe ser fluida y natural visualmente.
      
      2. "summary": Un resumen educativo, rico y MUY BIEN ESTRUCTURADO. 
         - EL FORMATO ES CRÍTICO: Usa Markdown para dar estructura visual.
         - Usa Títulos (###) para separar secciones (ej: Introducción, Conceptos Clave, Conclusión).
         - Usa **Negritas** para resaltar términos importantes.
         - Usa listas con viñetas (-) para enumerar características o pasos.
         - Debe ser un material de estudio listo para leer, no solo texto plano.

      Respuesta JSON esperada:
      {
        "transcript": "Párrafo 1...\\n\\nPárrafo 2...",
        "summary": "### Introducción\\nTexto...\\n\\n### Puntos Clave\\n- Item 1\\n- Item 2"
      }
    `;

    const result = await executeWithCircuitBreaker(
      'gemini-process-video',
      () => model.generateContent([
        { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
        { text: prompt },
      ]),
      CIRCUIT_BREAKER_DEFAULTS.gemini,
    );

    const responseText = result.response.text();
    const data = JSON.parse(responseText);

    // 5. Limpieza
    await fileManager.deleteFile(uploadName);
    await unlink(filePath);

    return NextResponse.json({
      success: true,
      transcript: data.transcript,
      summary: data.summary,
    });

  } catch (error) {
    techDebtLogger.error('❌ Error processing video:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
