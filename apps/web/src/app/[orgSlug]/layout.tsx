import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';

import { createClient } from '@/lib/supabase/server';
import { OrganizationLayoutClient } from './OrganizationLayoutClient';

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

/**
 * Server-side organization layout that validates:
 * 1. Organization exists by slug
 * 2. User is authenticated
 * 3. User belongs to the organization OR is a platform administrator
 *
 * If validation fails, redirects appropriately.
 */
export default async function OrganizationLayout({
  children,
  params,
}: OrgLayoutProps) {
  const { orgSlug } = await params;

  // Skip validation for known static routes that might conflict
  const staticRoutes = [
    'api',
    'auth',
    '_next',
    'public',
    'favicon.ico',
  ];

  if (staticRoutes.includes(orgSlug)) {
    return <>{children}</>;
  }

  // Create Supabase client for server-side validation
  const supabase = await createClient();

  // Get current user using specific SessionService that handles custom cookies
  const { SessionService } = await import('@/features/auth/services/session.service');
  const authUser = await SessionService.getCurrentUser();

  // If not authenticated, redirect to login
  if (!authUser) {
    redirect(`/auth?redirect=/${orgSlug}/dashboard`);
  }

  // Run all three queries in parallel:
  // - users: to know if the user is a platform admin
  // - organizations: to validate the org exists and get its data
  // - organization_users: membership check via orgSlug join (no need to wait for org.id)
  // The membership query uses an !inner join on organizations so it only returns a row
  // when BOTH the slug matches AND the user is an active member — safe to run upfront.
  const [userResult, organizationResult, membershipResult] = await Promise.all([
    supabase
      .from('users')
      .select('platform_role')
      .eq('id', authUser.id)
      .single(),
    supabase
      .from('organizations')
      .select('id, name, slug, logo_url, brand_logo_url, brand_color_primary, brand_color_secondary, brand_color_accent, brand_font_family, branding_enabled, show_navbar_name, subscription_plan, subscription_status')
      .eq('slug', orgSlug)
      .eq('is_active', true)
      .single(),
    supabase
      .from('organization_users')
      .select('role, status, organizations!inner(slug)')
      .eq('user_id', authUser.id)
      .eq('status', 'active')
      .eq('organizations.slug', orgSlug)
      .maybeSingle(),
  ]);

  const isPlatformAdmin = userResult.data?.platform_role?.toLowerCase().trim() === 'administrador';
  const { data: organization, error: orgError } = organizationResult;

  // Organization not found
  if (orgError || !organization) {
    notFound();
  }

  // Check if user belongs to this organization (skip for platform admins)
  let userRole: 'owner' | 'admin' | 'member' = 'admin'; // Default for platform admins

  if (!isPlatformAdmin) {
    const membership = membershipResult.data;
    if (!membership) {
      redirect('/dashboard?error=not_member');
    }

    userRole = membership.role as 'owner' | 'admin' | 'member';
  }

  // Organization data to pass to client
  const orgData = {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    logoUrl: organization.logo_url,
    brandLogoUrl: organization.brand_logo_url,
    brandColorPrimary: organization.brand_color_primary,
    brandColorSecondary: organization.brand_color_secondary,
    brandColorAccent: organization.brand_color_accent,
    brandFontFamily: organization.brand_font_family,
    brandingEnabled: organization.branding_enabled ?? false,
    showNavbarName: organization.show_navbar_name ?? true,
    role: userRole,
    subscriptionPlan: organization.subscription_plan as 'team' | 'business' | 'enterprise' | undefined,
    subscriptionStatus: organization.subscription_status as 'active' | 'expired' | 'cancelled' | 'trial' | 'pending' | undefined,
    isPlatformAdmin,
  };

  return (
    <OrganizationLayoutClient organization={orgData}>
      {children}
    </OrganizationLayoutClient>
  );
}

/**
 * Generate static params for common organization slugs (optional optimization)
 * This can be removed if not needed
 */
// export async function generateStaticParams() {
//   return [];
// }
