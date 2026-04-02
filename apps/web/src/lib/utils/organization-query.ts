/**
 * Organization Query Utilities
 *
 * Helper functions for adding organization context to Supabase queries.
 * Use these utilities to ensure consistent organization isolation across the app.
 *
 * @example
 * ```ts
 * // In an API route
 * const supabase = await createServerClient();
 * const orgContext = await getOrganizationContext(request, userId);
 *
 * // Query with organization filter
 * let query = supabase
 *   .from('user_course_enrollments')
 *   .select('*')
 *   .eq('user_id', userId);
 *
 * query = withOrganizationFilter(query, orgContext.organizationId);
 * ```
 */

interface OrganizationScopedQuery<TQuery> {
  eq(column: string, value: string): TQuery;
  is(column: string, value: null): TQuery;
}

/**
 * Add organization filter to a Supabase query.
 *
 * Handles both B2B (with organization_id) and B2C (organization_id IS NULL) cases.
 *
 * @param query - The Supabase query builder
 * @param organizationId - Organization ID or null for B2C users
 * @returns The query with organization filter applied
 */
export function withOrganizationFilter<TQuery extends OrganizationScopedQuery<TQuery>>(
  query: TQuery,
  organizationId: string | null
): TQuery {
  if (organizationId) {
    return query.eq('organization_id', organizationId);
  } else {
    return query.is('organization_id', null);
  }
}

/**
 * Build organization filter condition for use in raw SQL or complex queries.
 *
 * @param organizationId - Organization ID or null for B2C users
 * @returns SQL condition string
 */
export function buildOrganizationCondition(organizationId: string | null): string {
  if (organizationId) {
    return `organization_id = '${organizationId}'`;
  } else {
    return `organization_id IS NULL`;
  }
}

/**
 * Data to include when creating a new record that should be organization-scoped.
 *
 * @param organizationId - Organization ID or null for B2C users
 * @returns Object with organization_id field
 */
export function withOrganizationData(organizationId: string | null): {
  organization_id: string | null;
} {
  return { organization_id: organizationId };
}

/**
 * Type guard to check if a value is a valid organization ID (UUID).
 *
 * @param value - Value to check
 * @returns True if valid UUID
 */
export function isValidOrganizationId(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Extract organization ID from various sources in order of priority:
 * 1. Explicit parameter
 * 2. Request header (X-Organization-ID)
 * 3. Query parameter (organizationId or org)
 *
 * @param request - NextRequest object
 * @param explicitOrgId - Explicit organization ID (highest priority)
 * @returns Organization ID or null
 */
export function extractOrganizationId(
  request: Request,
  explicitOrgId?: string | null
): string | null {
  // Priority 1: Explicit parameter
  if (explicitOrgId && isValidOrganizationId(explicitOrgId)) {
    return explicitOrgId;
  }

  // Priority 2: Header
  const headerOrgId = request.headers.get('X-Organization-ID');
  if (headerOrgId && isValidOrganizationId(headerOrgId)) {
    return headerOrgId;
  }

  // Priority 3: Query parameters
  const url = new URL(request.url);
  const queryOrgId =
    url.searchParams.get('organizationId') || url.searchParams.get('org_id');
  if (queryOrgId && isValidOrganizationId(queryOrgId)) {
    return queryOrgId;
  }

  return null;
}

/**
 * Migration helper: Update existing records with organization_id
 *
 * This is useful for backfilling organization_id on existing records.
 * Should be used in migration scripts, not runtime code.
 *
 * @example
 * ```sql
 * -- Using the helper pattern in SQL:
 * UPDATE user_course_enrollments e
 * SET organization_id = (
 *   SELECT ou.organization_id
 *   FROM organization_users ou
 *   WHERE ou.user_id = e.user_id
 *   AND ou.status = 'active'
 *   ORDER BY ou.joined_at ASC
 *   LIMIT 1
 * )
 * WHERE e.organization_id IS NULL;
 * ```
 */
export const MIGRATION_NOTES = {
  backfillPattern: `
    -- For each table that needs organization_id backfilled:
    -- 1. First try to match via related tables (e.g., organization_course_assignments)
    -- 2. Fall back to user's primary organization from organization_users
    -- 3. Leave as NULL for B2C users (no organization membership)
  `,
  verifyQuery: `
    -- Verify migration completed correctly:
    SELECT
      COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as migrated,
      COUNT(*) FILTER (WHERE organization_id IS NULL) as b2c_or_pending
    FROM user_course_enrollments;
  `,
};
