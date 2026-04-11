import { createClient } from '../../../../lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../lib/supabase/types';
import {
  buildReportProblemMetadata,
  serializeReportProblemMetadata,
  uploadReportImageAttachments,
} from '@/core/reporting/report-problem.server';
import {
  REPORT_PROBLEM_CATEGORIES,
  REPORT_PROBLEM_PRIORITIES,
  type ReportProblemCourseContext,
  type ReportProblemOriginContext,
  type UploadedReportAttachment,
} from '@/core/reporting/report-problem.contract';
import type { ChatRequest } from './platform-context.service';

type ReportProblemInsert =
  Database['public']['Tables']['reportes_problemas']['Insert'];

export interface LiaChatProcessingBody extends ChatRequest {
  isBugReport?: boolean;
  enrichedMetadata?: Record<string, unknown>;
  sessionSnapshot?: string;
  recordingStatus?: string;
  conversationId?: string;
}

interface BugReportTokenPayload {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
}

interface BugReportDraftRuntimeContext {
  originalUserMessage: string;
  originContext: ReportProblemOriginContext;
  courseContext: ReportProblemCourseContext | null;
  attachments: UploadedReportAttachment[];
  attachmentUploadWarnings: string[];
  recordingUrl: string | null;
  recordingStatus: string | null;
  recordingSize: string | null;
  recordingDurationSeconds: number | null;
  screenResolution: string | null;
  browser: string | null;
  clientDiagnostics: Record<string, unknown>;
}

export interface BugReportDraftTokenPayload extends BugReportTokenPayload {
  schemaVersion?: 1;
  status?: 'draft';
  runtimeContext?: BugReportDraftRuntimeContext;
}

interface ExtractedToken<T> {
  payload: T;
  token: string;
}

interface PreparedDraftResponse {
  assistantContentToPersist: string;
  clientContent: string;
  draft: BugReportDraftTokenPayload;
}

interface ConfirmedBugReportResult {
  bugReportSaved: boolean;
  clientContent: string;
}

export type BugReportConfirmationIntent = 'confirm' | 'revise' | 'unclear';

const BUG_REPORT_DRAFT_REGEX = /\[\[BUG_REPORT_DRAFT:(\{[\s\S]*?\})\]\]/;
const BUG_REPORT_REGEX = /\[\[BUG_REPORT:(\{[\s\S]*?\})\]\]/;
const CONFIRMATION_REMINDER =
  '¿Confirmas que este reporte técnico quedó correcto para enviarlo al equipo? Si algo no refleja bien el problema, dime qué ajustar.';

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Configuracion incompleta de Supabase para reportes');
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function parseJsonPayload<T>(rawPayload: string): T {
  try {
    return JSON.parse(rawPayload) as T;
  } catch {
    const normalizedPayload = rawPayload
      .replace(/[\n\r]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return JSON.parse(normalizedPayload) as T;
  }
}

function normalizeBugCategory(value: string | null): string {
  return value &&
    REPORT_PROBLEM_CATEGORIES.includes(
      value as (typeof REPORT_PROBLEM_CATEGORIES)[number]
    )
    ? value
    : 'bug';
}

function normalizeBugPriority(value: string | null): string {
  return value &&
    REPORT_PROBLEM_PRIORITIES.includes(
      value as (typeof REPORT_PROBLEM_PRIORITIES)[number]
    )
    ? value
    : 'media';
}

function extractToken<T>(
  content: string,
  regex: RegExp
): ExtractedToken<T> | null {
  const match = content.match(regex);

  if (!match?.[1]) {
    return null;
  }

  return {
    payload: parseJsonPayload<T>(match[1]),
    token: match[0],
  };
}

function stripTokenMarkers(content: string): string {
  return content
    .replace(BUG_REPORT_DRAFT_REGEX, '')
    .replace(BUG_REPORT_REGEX, '')
    .trim();
}

function ensureConfirmationPrompt(content: string): string {
  const alreadyRequestsConfirmation =
    /confirmas|esta correcto|está correcto|quieres que lo envie|quieres que lo envíe|puedo enviarlo|puedo enviarlo/i.test(
      content
    );

  if (!content.trim()) {
    return CONFIRMATION_REMINDER;
  }

  if (alreadyRequestsConfirmation) {
    return content.trim();
  }

  return `${content.trim()}\n\n${CONFIRMATION_REMINDER}`;
}

function buildCourseContext(
  requestContext: ChatRequest['context']
): ReportProblemCourseContext | null {
  const lessonContext = requestContext?.currentLessonContext;

  if (!lessonContext) {
    return null;
  }

  return {
    contextType: lessonContext.contextType,
    courseId: lessonContext.courseId,
    courseSlug: lessonContext.courseSlug,
    courseTitle: lessonContext.courseTitle,
    moduleId: lessonContext.moduleId,
    moduleTitle: lessonContext.moduleTitle,
    lessonId: lessonContext.lessonId,
    lessonTitle: lessonContext.lessonTitle,
    currentTab: lessonContext.currentTab || requestContext?.currentTab,
    currentPage: lessonContext.currentPage || requestContext?.currentPage,
  };
}

function buildOriginContext(
  requestContext: ChatRequest['context']
): ReportProblemOriginContext {
  return {
    paginaUrl: requestContext?.currentPage || null,
    pathname: requestContext?.currentPage || null,
    currentPage: requestContext?.currentPage || null,
    currentTab: requestContext?.currentTab || null,
    pageType: requestContext?.pageType ? String(requestContext.pageType) : null,
  };
}

function buildScreenResolution(
  enrichedMetadata: Record<string, unknown> | undefined
): string | null {
  const metadataRecord = enrichedMetadata ? asRecord(enrichedMetadata) : null;
  const viewport = metadataRecord ? asRecord(metadataRecord.viewport) : null;
  const width = readNumber(viewport?.width);
  const height = readNumber(viewport?.height);

  if (!width || !height) {
    return null;
  }

  return `${width}x${height}`;
}

function buildLiaDiagnostics(
  body: LiaChatProcessingBody,
  originalUserMessage: string,
  recordingUrl: string | null
): Record<string, unknown> {
  const metadataRecord = body.enrichedMetadata
    ? asRecord(body.enrichedMetadata)
    : null;

  const errors = metadataRecord?.errors;
  const contextMarkers = metadataRecord?.contextMarkers;

  return {
    chatMessageContent: originalUserMessage,
    aiGeneratedTitle: null,
    clientViewport: metadataRecord?.viewport,
    clientPlatform: metadataRecord?.platform,
    clientLanguage: metadataRecord?.language,
    clientTimezone: metadataRecord?.timezone,
    clientConnection: metadataRecord?.connection,
    clientMemory: metadataRecord?.memory,
    sessionDurationMs: metadataRecord?.sessionDuration,
    recentErrors: Array.isArray(errors) ? errors.slice(-5) : [],
    errorSummary: metadataRecord?.errorSummary,
    contextMarkers: Array.isArray(contextMarkers)
      ? contextMarkers.slice(-10)
      : [],
    sessionSummary: metadataRecord?.sessionSummary,
    recordingInfo: metadataRecord?.recordingInfo,
    isCompressed: body.sessionSnapshot?.startsWith('gzip:') || false,
    detectedAsBug: body.isBugReport || false,
    recordingUrl,
  };
}

function mergeUploadedAttachments(
  existingAttachments: UploadedReportAttachment[],
  newAttachments: UploadedReportAttachment[]
): UploadedReportAttachment[] {
  const deduplicated = new Map<string, UploadedReportAttachment>();

  [...existingAttachments, ...newAttachments].forEach((attachment) => {
    const key =
      attachment.storagePath ||
      `${attachment.fileName}-${attachment.size}-${attachment.publicUrl}`;
    deduplicated.set(key, attachment);
  });

  return Array.from(deduplicated.values());
}

async function uploadSessionRecording(
  sessionSnapshot: string,
  userId: string
): Promise<string | null> {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const isCompressed = sessionSnapshot.startsWith('gzip:');
    let buffer: Buffer;
    let extension: string;
    let contentType: string;

    if (isCompressed) {
      const base64Data = sessionSnapshot.slice(5);
      buffer = Buffer.from(base64Data, 'base64');
      extension = 'json.gz';
      contentType = 'application/gzip';
    } else {
      buffer = Buffer.from(sessionSnapshot, 'utf-8');
      extension = 'json';
      contentType = 'application/json';
    }

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2, 9);
    const fileName = `recording-${userId}-${timestamp}-${randomId}.${extension}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('reportes-screenshots')
      .upload(fileName, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

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

async function buildDraftRuntimeContext(
  body: LiaChatProcessingBody,
  requestContext: ChatRequest['context'],
  previousRuntimeContext?: BugReportDraftRuntimeContext
): Promise<BugReportDraftRuntimeContext> {
  const lastMessage = body.messages[body.messages.length - 1];
  const metadataRecord = asRecord(body.enrichedMetadata);
  const recordingInfoRecord = asRecord(metadataRecord?.recordingInfo);

  let uploadedAttachments = previousRuntimeContext?.attachments || [];
  let attachmentUploadWarnings =
    previousRuntimeContext?.attachmentUploadWarnings || [];
  let recordingUrl = previousRuntimeContext?.recordingUrl || null;

  if (requestContext?.userId && lastMessage?.attachments?.length) {
    const uploadResult = await uploadReportImageAttachments(
      lastMessage.attachments,
      requestContext.userId
    );
    uploadedAttachments = mergeUploadedAttachments(
      uploadedAttachments,
      uploadResult.assets
    );
    attachmentUploadWarnings = [
      ...attachmentUploadWarnings,
      ...uploadResult.warnings,
    ];
  }

  if (requestContext?.userId && body.sessionSnapshot) {
    const uploadedRecordingUrl = await uploadSessionRecording(
      body.sessionSnapshot,
      requestContext.userId
    );

    if (uploadedRecordingUrl) {
      recordingUrl = uploadedRecordingUrl;
    }
  }

  const originalUserMessage =
    previousRuntimeContext?.originalUserMessage || lastMessage?.content || '';

  return {
    originalUserMessage,
    originContext:
      previousRuntimeContext?.originContext || buildOriginContext(requestContext),
    courseContext:
      previousRuntimeContext?.courseContext || buildCourseContext(requestContext),
    attachments: uploadedAttachments,
    attachmentUploadWarnings,
    recordingUrl,
    recordingStatus:
      body.recordingStatus ||
      previousRuntimeContext?.recordingStatus ||
      'unknown',
    recordingSize:
      readString(recordingInfoRecord?.size) ||
      previousRuntimeContext?.recordingSize ||
      null,
    recordingDurationSeconds:
      metadataRecord?.sessionDuration && readNumber(metadataRecord.sessionDuration)
        ? Math.round(Number(metadataRecord.sessionDuration) / 1000)
        : previousRuntimeContext?.recordingDurationSeconds || null,
    screenResolution:
      buildScreenResolution(body.enrichedMetadata) ||
      previousRuntimeContext?.screenResolution ||
      null,
    browser:
      readString(metadataRecord?.platform) ||
      previousRuntimeContext?.browser ||
      null,
    clientDiagnostics: metadataRecord
      ? buildLiaDiagnostics(body, originalUserMessage, recordingUrl)
      : previousRuntimeContext?.clientDiagnostics || {},
  };
}

function serializeDraftToken(
  payload: BugReportDraftTokenPayload
): string {
  return `[[BUG_REPORT_DRAFT:${JSON.stringify(payload)}]]`;
}

export function extractBugReportDraftToken(
  content: string
): BugReportDraftTokenPayload | null {
  try {
    return extractToken<BugReportDraftTokenPayload>(
      content,
      BUG_REPORT_DRAFT_REGEX
    )?.payload ?? null;
  } catch (error) {
    console.error('Error leyendo el borrador de reporte de SofLIA:', error);
    return null;
  }
}

export function stripBugReportTokens(content: string): string {
  return stripTokenMarkers(content);
}

export function detectBugReportConfirmationIntent(
  message: string
): BugReportConfirmationIntent {
  const normalizedMessage = message.trim().toLowerCase();

  if (!normalizedMessage) {
    return 'unclear';
  }

  const revisePatterns = [
    /\bpero\b/,
    /^no\b/,
    /\bcorrige\b/,
    /\bajusta\b/,
    /\bcambia\b/,
    /\bmodifica\b/,
    /\bagrega\b/,
    /\bquita\b/,
    /\bfalta\b/,
    /\breformula\b/,
    /\bno exactamente\b/,
    /\bno del todo\b/,
    /\bmejor\b/,
  ];

  if (revisePatterns.some((pattern) => pattern.test(normalizedMessage))) {
    return 'revise';
  }

  const confirmPatterns = [
    /^s[ií]\b/,
    /^yes\b/,
    /^ok\b/,
    /^okay\b/,
    /^vale\b/,
    /^va\b/,
    /^dale\b/,
    /^de acuerdo\b/,
    /^correcto\b/,
    /^confirmo\b/,
    /^procede\b/,
    /^adelante\b/,
    /^env[ií]alo\b/,
    /^mand[aá]lo\b/,
    /^qued[oó] bien\b/,
    /^as[ií] est[aá] bien\b/,
    /^est[aá] correcto\b/,
  ];

  return confirmPatterns.some((pattern) => pattern.test(normalizedMessage))
    ? 'confirm'
    : 'unclear';
}

export function buildPendingBugReportPromptSection(
  draft: BugReportDraftTokenPayload
): string {
  const title = readString(draft.title) || 'Sin titulo tecnico';
  const description =
    readString(draft.description) || 'Sin descripcion tecnica.';
  const category = normalizeBugCategory(readString(draft.category));
  const priority = normalizeBugPriority(readString(draft.priority));

  return (
    '\n\n## Flujo Activo de Reporte Tecnico\n' +
    'Tienes un borrador de reporte pendiente de validacion del usuario. Todavia NO debes enviarlo al sistema de reportes.\n' +
    `- Titulo tecnico actual: ${title}\n` +
    `- Descripcion tecnica actual: ${description}\n` +
    `- Categoria actual: ${category}\n` +
    `- Prioridad actual: ${priority}\n` +
    'Si el usuario corrige, amplia o aclara el caso, debes actualizar el borrador con lenguaje tecnico claro, mostrar la nueva version al usuario y volver a pedir confirmacion explicita.\n' +
    'Si el usuario cambia de tema, responde normalmente y no generes ningun bloque oculto de reporte.\n' +
    'Cuando sigas en el flujo de reporte, al final de tu respuesta agrega el bloque oculto [[BUG_REPORT_DRAFT:{...}]] con el borrador actualizado y NO uses [[BUG_REPORT:{...}]].'
  );
}

export async function prepareDraftResponseForPersistence(params: {
  finalContent: string;
  body: LiaChatProcessingBody;
  requestContext: ChatRequest['context'];
  previousDraft?: BugReportDraftTokenPayload | null;
}): Promise<PreparedDraftResponse | null> {
  const { finalContent, body, requestContext, previousDraft } = params;

  const draftMatch = extractToken<BugReportDraftTokenPayload>(
    finalContent,
    BUG_REPORT_DRAFT_REGEX
  );
  const legacyDraftMatch = draftMatch
    ? null
    : extractToken<BugReportTokenPayload>(finalContent, BUG_REPORT_REGEX);

  if (!draftMatch && !legacyDraftMatch) {
    return null;
  }

  const baseDraft = draftMatch?.payload || legacyDraftMatch?.payload;

  if (!baseDraft) {
    return null;
  }

  const runtimeContext = await buildDraftRuntimeContext(
    body,
    requestContext,
    previousDraft?.runtimeContext
  );

  const normalizedDraft: BugReportDraftTokenPayload = {
    schemaVersion: 1,
    status: 'draft',
    title:
      readString(baseDraft.title) ||
      readString(previousDraft?.title) ||
      'Reporte tecnico desde SofLIA',
    description:
      readString(baseDraft.description) ||
      readString(previousDraft?.description) ||
      runtimeContext.originalUserMessage,
    category: normalizeBugCategory(
      readString(baseDraft.category) || readString(previousDraft?.category)
    ),
    priority: normalizeBugPriority(
      readString(baseDraft.priority) || readString(previousDraft?.priority)
    ),
    runtimeContext,
  };

  const sourceToken = draftMatch?.token || legacyDraftMatch?.token;
  const clientContent = ensureConfirmationPrompt(
    stripTokenMarkers(finalContent)
  );
  const assistantContentToPersist = sourceToken
    ? finalContent.replace(sourceToken, serializeDraftToken(normalizedDraft))
    : `${finalContent}\n\n${serializeDraftToken(normalizedDraft)}`;

  return {
    clientContent,
    assistantContentToPersist,
    draft: normalizedDraft,
  };
}

export async function submitConfirmedBugReport(params: {
  draft: BugReportDraftTokenPayload;
  body: LiaChatProcessingBody;
  requestContext: ChatRequest['context'];
  request: { headers: { get: (key: string) => string | null } };
}): Promise<ConfirmedBugReportResult> {
  const { draft, body, requestContext, request } = params;

  if (!requestContext?.userId) {
    return {
      bugReportSaved: false,
      clientContent:
        'Puedo dejar listo el reporte tecnico, pero para enviarlo necesito que estes autenticado en tu cuenta.',
    };
  }

  const runtimeContext =
    draft.runtimeContext ||
    (await buildDraftRuntimeContext(body, requestContext));

  const supabase = await createClient();
  const reportPayload: ReportProblemInsert = {
    user_id: requestContext.userId,
    titulo: readString(draft.title) || 'Reporte tecnico desde SofLIA',
    descripcion:
      readString(draft.description) || runtimeContext.originalUserMessage,
    categoria: normalizeBugCategory(readString(draft.category)),
    prioridad: normalizeBugPriority(readString(draft.priority)),
    estado: 'pendiente',
    pagina_url: runtimeContext.originContext.paginaUrl || 'chat-lia',
    pathname: runtimeContext.originContext.pathname,
    user_agent: request.headers.get('user-agent'),
    screen_resolution: runtimeContext.screenResolution,
    screenshot_url: runtimeContext.attachments[0]?.publicUrl ?? null,
    session_recording: runtimeContext.recordingUrl,
    recording_size: runtimeContext.recordingSize,
    recording_duration: runtimeContext.recordingDurationSeconds,
    metadata: serializeReportProblemMetadata(
      buildReportProblemMetadata({
        source: runtimeContext.courseContext
          ? 'lia_course_chat'
          : 'lia_chat_automatic',
        fromLia: true,
        originContext: runtimeContext.originContext,
        courseContext: runtimeContext.courseContext,
        attachments: runtimeContext.attachments,
        attachmentUploadWarnings: runtimeContext.attachmentUploadWarnings,
        clientContext: {
          userAgent: request.headers.get('user-agent'),
          screenResolution: runtimeContext.screenResolution,
          browser: runtimeContext.browser,
        },
        liaContext: {
          conversationId: body.conversationId || null,
          recordingStatus: runtimeContext.recordingStatus || 'unknown',
          hasSessionRecording: Boolean(runtimeContext.recordingUrl),
          recordingUrl: runtimeContext.recordingUrl,
          detectedAsBug: true,
          aiGeneratedTitle: readString(draft.title),
          chatMessageContent: runtimeContext.originalUserMessage,
          clientDiagnostics: runtimeContext.clientDiagnostics,
        },
      })
    ),
  };

  const { error } = await supabase.from('reportes_problemas').insert(reportPayload);

  if (error) {
    console.error('Error guardando el reporte confirmado de SofLIA:', error);
    return {
      bugReportSaved: false,
      clientContent:
        'Hubo un problema tecnico al enviar tu reporte. El borrador sigue listo; si quieres, puedes intentar confirmarlo de nuevo en unos segundos.',
    };
  }

  return {
    bugReportSaved: true,
    clientContent: buildBugConfirmationMessage({
      recordingUrl: runtimeContext.recordingUrl,
      recordingStatus: runtimeContext.recordingStatus,
      hasImageEvidence: runtimeContext.attachments.length > 0,
      attachmentUploadWarnings: runtimeContext.attachmentUploadWarnings,
    }),
  };
}

function buildBugConfirmationMessage({
  recordingUrl,
  recordingStatus,
  hasImageEvidence,
  attachmentUploadWarnings,
}: {
  recordingUrl: string | null;
  recordingStatus: string | null;
  hasImageEvidence: boolean;
  attachmentUploadWarnings: string[];
}): string {
  if (recordingUrl && hasImageEvidence) {
    return 'Reporte confirmado y enviado con evidencia visual y grabacion de sesion. El equipo tecnico ya tiene el detalle tecnico validado para revisarlo.';
  }

  if (recordingUrl) {
    return 'Reporte confirmado y enviado con grabacion de sesion. El equipo tecnico ya tiene el detalle tecnico validado para revisarlo.';
  }

  if (hasImageEvidence && attachmentUploadWarnings.length === 0) {
    return 'Reporte confirmado y enviado con evidencia visual adjunta. El equipo tecnico ya tiene el detalle tecnico validado para revisarlo.';
  }

  if (recordingStatus === 'unavailable') {
    return 'Reporte confirmado y enviado. La grabacion de pantalla no estaba disponible, pero el detalle tecnico validado ya quedo registrado para el equipo.';
  }

  if (recordingStatus === 'error' || recordingStatus === 'inactive') {
    return 'Reporte confirmado y enviado. No pudimos conservar la grabacion de pantalla, pero el detalle tecnico validado ya quedo registrado para el equipo.';
  }

  return 'Reporte confirmado y enviado correctamente. El equipo tecnico ya tiene el detalle tecnico validado para revisarlo.';
}
