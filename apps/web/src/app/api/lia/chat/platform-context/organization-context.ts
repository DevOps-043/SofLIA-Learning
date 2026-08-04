import type { ResolvedOrganizationContext } from '../organization-context.service'
import type { PlatformContext } from './context.types'

export function applyResolvedOrganizationContext(
  context: PlatformContext,
  organizationContext?: ResolvedOrganizationContext | null,
): void {
  if (!organizationContext) return

  context.organizationId = organizationContext.organizationId
  context.organizationName = organizationContext.organizationName
  context.organizationSlug = organizationContext.organizationSlug
  context.userJobTitle = organizationContext.userJobTitle
  context.userJobDescription = organizationContext.userJobDescription
  context.organizationIndustry = organizationContext.organizationIndustry
  context.organizationSize = organizationContext.organizationSize
  context.organizationType = organizationContext.organizationType
  context.organizationMission = organizationContext.organizationMission
  context.organizationCountry = organizationContext.organizationCountry
}
