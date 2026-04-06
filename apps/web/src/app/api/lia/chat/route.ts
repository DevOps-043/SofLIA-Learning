import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { fetchPlatformContext, PlatformContext, ChatRequest } from './platform-context.service';
import { getLIASystemPrompt } from './system-prompt.service';
import {
  buildFullContext,
  appendPersonalizationPrompt,
  appendBugReportContext,
  buildCleanHistory,
} from './chat-context.builder';
import { processAIResponse } from './chat-response.formatter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ============================================
// API HANDLER
// ============================================
export async function POST(request: NextRequest) {

  let shouldStream = true;

  try {
    const body: ChatRequest & {
      isBugReport?: boolean;
      enrichedMetadata?: Record<string, unknown>;
      sessionSnapshot?: string;
      recordingStatus?: string;
      conversationId?: string;
    } = await request.json();

    const { messages, context: requestContext, stream = true } = body;
    shouldStream = stream;

    // Validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un mensaje' },
        { status: 400 }
      );
    }

    // Verify API Key
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      console.error('❌ GOOGLE_API_KEY no está configurada');
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY no está configurada' },
        { status: 500 }
      );
    }

    // Build enriched context
    const platformContext = await fetchPlatformContext(requestContext?.userId);
    const fullContext: PlatformContext = await buildFullContext(platformContext, requestContext);

    // Build system prompt
    let systemPrompt = getLIASystemPrompt(fullContext);

    // Append personalization settings
    if (requestContext?.userId) {
      systemPrompt = await appendPersonalizationPrompt(systemPrompt, requestContext.userId);
    }

    // Validate last message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Se requiere un mensaje del usuario' },
        { status: 400 }
      );
    }

    // Optionally append bug-report context
    systemPrompt = await appendBugReportContext(
      systemPrompt,
      lastMessage.content,
      body.isBugReport || false,
      fullContext.currentPage
    );

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(googleApiKey);
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
    });

    const cleanHistory = buildCleanHistory(messages);
    const messageWithContext = systemPrompt + '\n\n---\n\nUsuario: ' + lastMessage.content;

    const chatSession = model.startChat({
      history: cleanHistory,
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
    });

    const result = await chatSession.sendMessage(messageWithContext);
    const finalContent = result.response.text();

    // Post-process: handle bug reports, save conversation history
    const { clientContent } = await processAIResponse(
      finalContent,
      body,
      requestContext,
      request
    );

    // Stream or JSON response
    if (shouldStream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        start(controller) {
          const text = clientContent;
          const chunkSize = 50;
          let i = 0;

          function push() {
            if (i >= text.length) {
              controller.enqueue(encoder.encode('data: ' + JSON.stringify({ done: true }) + '\n\n'));
              controller.close();
              return;
            }
            const chunk = text.slice(i, i + chunkSize);
            controller.enqueue(encoder.encode('data: ' + JSON.stringify({ content: chunk, done: false }) + '\n\n'));
            i += chunkSize;
            setTimeout(push, 10);
          }
          push();
        }
      });

      return new Response(readable, {
        headers: { 'Content-Type': 'text/event-stream' }
      });
    } else {
      return NextResponse.json({
        message: { role: 'assistant', content: clientContent }
      });
    }

  } catch (error) {
    console.error('❌ LIA Chat API error:', error);

    let errorMessage = 'Error interno del servidor';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error stack:', error.stack);
    }

    // Handle Rate Limit
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')) {
      const politeMessage = "⏳ Lo siento, he alcanzado mi límite de capacidad. Por favor espera unos segundos.";

      if (shouldStream) {
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('data: ' + JSON.stringify({ content: politeMessage, done: false }) + '\n\n'));
            controller.enqueue(encoder.encode('data: ' + JSON.stringify({ done: true }) + '\n\n'));
            controller.close();
          }
        });
        return new Response(readable, { headers: { 'Content-Type': 'text/event-stream' } });
      } else {
        return NextResponse.json({ message: { role: 'assistant', content: politeMessage } });
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'LIA Chat API Ready with Platform Context'
  });
}
