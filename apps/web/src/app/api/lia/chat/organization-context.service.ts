export {
  createOrganizationAiContextRepository as createOrganizationContextRepository,
  extractOrganizationSlugFromPage,
  resolveActiveOrganizationAiContext as resolveActiveOrganizationContext,
} from '@/lib/lia-context/services/organization-ai-context.service'

export type {
  OrganizationAiContextRepository as OrganizationContextRepository,
  ResolvedOrganizationAiContext as ResolvedOrganizationContext,
} from '@/lib/lia-context/services/organization-ai-context.service'
