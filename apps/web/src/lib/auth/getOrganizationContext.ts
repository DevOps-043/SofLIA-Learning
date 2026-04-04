import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Organization context returned from getOrganizationContext
 */
export interface OrganizationContext {
  /** Organization ID (null for B2C users) */
  organizationId: string | null;

  /** Organization slug (null for B2C users) */
  organizationSlug: string | null;

  /** User's role in the organization */
  role: 'owner' | 'admin' | 'member' | null;

  /** Whether user is in B2B context */
  isB2B: boolean;

  /** Whether user is an admin/owner of the organization */
  isOrgAdmin: boolean;
}

/**
 * Extract organization context from a Next.js API request.
 *
 * Checks multiple sources for organization identification:
 * 1. URL path parameter (/{org-slug}/api/...)
 * 2. X-Organization-ID header
 * 3. X-Organization-Slug header
 * 4. Query parameter (?org=slug or ?organizationId=uuid)
 *
 * Verifies that the user belongs to the specified organization.
 *
 * @param request - The Next.js request object
 * @param userId - The authenticated user's ID
 * @returns Organization context with validation
 *
 * @example
 * ```ts
 * // In an API route
 * export async function GET(request: NextRequest) {
 *   const { userId } = await requireAuth();
 *   const orgContext = await getOrganizationContext(request, userId);
 *
 *   if (!orgContext.isB2B) {
 *     // B2C user - query without organization filter
 *   } else {
 *     // B2B user - include organization_id in query
 *     const { data } = await supabase
 *       .from('table')
 *       .eq('organization_id', orgContext.organizationId);
 *   }
 * }
 * ```
 */
export async function getOrganizationContext(
  request: NextRequest,
  userId: string
): Promise<OrganizationContext> {
  // Default context for B2C users
  const defaultContext: OrganizationContext = {
    organizationId: null,
    organizationSlug: null,
    role: null,
    isB2B: false,
    isOrgAdmin: false,
  };

  // Try to extract organization identifier from various sources

  // 1. URL path: /[orgSlug]/api/... or /api/.../[orgSlug]/...
  const pathname = request.nextUrl.pathname;
  let orgSlug = extractOrgSlugFromPath(pathname);

  // 2. Headers (takes precedence if provided)
  const headerOrgId = request.headers.get('X-Organization-ID');
  const headerOrgSlug = request.headers.get('X-Organization-Slug');

  // 3. Query parameters
  const queryOrgId = request.nextUrl.searchParams.get('organizationId');
  const queryOrgSlug = request.nextUrl.searchParams.get('org');

  // Determine which identifier to use
  let organizationId: string | null = headerOrgId || queryOrgId;
  orgSlug = headerOrgSlug || queryOrgSlug || orgSlug;

  // If no organization identifier found, return B2C context
  if (!organizationId && !orgSlug) {
    return defaultContext;
  }

  // Create Supabase client
  const supabase = await createClient();

  // Fetch organization and verify membership
  let orgQuery = supabase.from('organizations').select('id, slug, name');

  if (organizationId) {
    orgQuery = orgQuery.eq('id', organizationId);
  } else if (orgSlug) {
    orgQuery = orgQuery.eq('slug', orgSlug);
  }

  const { data: organization, error: orgError } = await orgQuery
    .eq('is_active', true)
    .single();

  if (orgError || !organization) {
    // Organization not found - treat as B2C
    return defaultContext;
  }

  // Verify user membership in organization
  const { data: membership, error: membershipError } = await supabase
    .from('organization_users')
    .select('role')
    .eq('organization_id', organization.id)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (membershipError || !membership) {
    // User not a member - treat as B2C (they shouldn't access org data)
    return defaultContext;
  }

  const role = membership.role as 'owner' | 'admin' | 'member';

  return {
    organizationId: organization.id,
    organizationSlug: organization.slug,
    role,
    isB2B: true,
    isOrgAdmin: role === 'owner' || role === 'admin',
  };
}

/**
 * Extract organization slug from URL path.
 *
 * Handles patterns like:
 * - /acme-corp/api/courses -> acme-corp
 * - /acme-corp/dashboard -> acme-corp
 *
 * Excludes known static routes to avoid false matches.
 */
function extractOrgSlugFromPath(pathname: string): string | null {
  // Known static route prefixes that are NOT organization slugs
  const staticRoutes = new Set([
    'api',
    'auth',
    '_next',
    'public',
    'courses',
    'profile',
    'settings',
    'communities',
    'news',
    'admin',
    'instructor',
    'business-panel',
    'business-user',
    'dashboard',
    'certificates',
    'study-planner',
    'account-settings',
    'privacy',
    'terms',
  ]);

  const pathParts = pathname.split('/').filter(Boolean);

  if (pathParts.length === 0) {
    return null;
  }

  const firstPart = pathParts[0];

  // Check if it's a known static route
  if (staticRoutes.has(firstPart)) {
    return null;
  }

  // Basic validation: slug should be lowercase alphanumeric with hyphens
  const slugPattern = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
  if (!slugPattern.test(firstPart)) {
    return null;
  }

  return firstPart;
}

/**
 * Helper to add organization filter to a Supabase query.
 *
 * Handles both B2B (with organization_id) and B2C (organization_id IS NULL) cases.
 *
 * @example
 * ```ts
 * const orgContext = await getOrganizationContext(request, userId);
 *
 * let query = supabase
 *   .from('user_course_enrollments')
 *   .select('*')
 *   .eq('user_id', userId);
 *
 * query = addOrganizationFilter(query, orgContext.organizationId);
 * ```
 */
export function addOrganizationFilter<T extends { eq: Function; is: Function }>(
  query: T,
  organizationId: string | null
): T {
  if (organizationId) {
    return query.eq('organization_id', organizationId);
  } else {
    return query.is('organization_id', null);
  }
}

/**
 * Type guard to check if request has valid organization context.
 */
export function hasOrganizationContext(
  context: OrganizationContext
): context is OrganizationContext & { organizationId: string } {
  return context.organizationId !== null;
}
