import type { SessionUserRecord } from '@/features/auth/services/session.types';
import { sanitizeContextPayload } from '@/lib/security/context-sanitizer';

import {
  buildFullContext,
  appendPersonalizationPrompt,
} from '../chat/chat-context.builder';
import { resolveActiveOrganizationContext } from '../chat/organization-context.service';
import { fetchPlatformContext } from '../chat/platform-context.service';
import type { ChatRequest, PlatformContext } from '../chat/platform-context.service';
import { getLIASystemPrompt } from '../chat/system-prompt.service';
import { buildLiaLiveStudyMemorySection } from './live-study-memory.service';
import type { LiaLiveTokenBody } from './schema';
import { buildLiaLiveVoiceGuardrails } from './voice-guardrails';

const MAX_REQUEST_CONTEXT_STRING_LENGTH = 1200;
const MAX_BASE_PROMPT_LENGTH = 38_000;
const MAX_SYSTEM_INSTRUCTION_LENGTH = 52_000;

type ContextRecord = Record<string, unknown>;

function asText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function asRecord(value: unknown): ContextRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as ContextRecord;
}

function optionalRecord(value: unknown): ContextRecord | undefined {
  const record = asRecord(value);
  return Object.keys(record).length > 0 ? record : undefined;
}

function truncatePromptSection(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}\n...[contexto truncado por limite de seguridad]`;
}

function getDisplayName(user: SessionUserRecord): string | undefined {
  const fullName = [asText(user.first_name), asText(user.last_name)]
    .filter(Boolean)
    .join(' ')
    .trim();

  return asText(user.display_name) || fullName || asText(user.username);
}

function buildVerifiedRequestContext(
  body: LiaLiveTokenBody,
  user: SessionUserRecord,
): ChatRequest['context'] {
  const pageContext = sanitizeContextPayload(
    asRecord(body.pageContext),
    MAX_REQUEST_CONTEXT_STRING_LENGTH,
  ) as PlatformContext;

  return {
    currentPage: asText(pageContext.currentPage),
    currentTab: asText(pageContext.currentTab),
    currentActivityContext: optionalRecord(pageContext.currentActivityContext) as PlatformContext['currentActivityContext'],
    currentLessonContext: optionalRecord(pageContext.currentLessonContext) as PlatformContext['currentLessonContext'],
    dashboardContext: optionalRecord(pageContext.dashboardContext),
    organizationId: asText(pageContext.organizationId),
    pageType: asText(pageContext.pageType) || body.contextType,
    userId: user.id,
    userName: getDisplayName(user),
    userRole: asText(user.platform_role),
  };
}

export async function buildLiaLiveSystemInstruction(
  body: LiaLiveTokenBody,
  user: SessionUserRecord,
): Promise<string> {
  const requestContext = buildVerifiedRequestContext(body, user);
  const activeOrganizationContext = await resolveActiveOrganizationContext({
    userId: user.id,
    requestedOrganizationId:
      typeof requestContext?.organizationId === 'string'
        ? requestContext.organizationId
        : undefined,
    currentPage: requestContext?.currentPage,
  });

  const organizationId = activeOrganizationContext?.organizationId ?? null;
  const [platformContext, studyMemorySection] = await Promise.all([
    fetchPlatformContext({
      userId: user.id,
      organizationContext: activeOrganizationContext,
    }),
    buildLiaLiveStudyMemorySection({
      userId: user.id,
      organizationId,
    }),
  ]);

  const fullContext = await buildFullContext(platformContext, requestContext);
  let basePrompt = getLIASystemPrompt(fullContext);
  basePrompt = await appendPersonalizationPrompt(basePrompt, user.id);

  const instruction = [
    truncatePromptSection(basePrompt, MAX_BASE_PROMPT_LENGTH),
    buildLiaLiveVoiceGuardrails(body),
    studyMemorySection,
  ]
    .filter(Boolean)
    .join('\n\n');

  return truncatePromptSection(instruction, MAX_SYSTEM_INSTRUCTION_LENGTH);
}
