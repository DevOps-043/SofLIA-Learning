/**
 * Exportaciones de servicios de contexto de LIA
 */

export { PageContextService } from './page-context.service';
export { 
  ContextBuilderService, 
  getContextBuilder, 
  buildLiaContext 
} from './context-builder.service';
export { ErrorContextService } from './error-context.service';
export type { SimilarBug, UserError } from './error-context.service';
export { ContextCacheService } from './context-cache.service';
export {
  buildOrganizationAiContextPromptSection,
  createOrganizationAiContextRepository,
  extractOrganizationSlugFromPage,
  resolveActiveOrganizationAiContext,
  resolveStrictOrganizationAiContext,
} from './organization-ai-context.service';
export type {
  OrganizationAiContextPromptOptions,
  OrganizationAiContextRepository,
  ResolvedOrganizationAiContext,
} from './organization-ai-context.service';
