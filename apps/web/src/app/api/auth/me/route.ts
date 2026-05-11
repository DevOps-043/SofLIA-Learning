import { NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { cacheHeaders } from '../../../../lib/utils/cache-headers';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';
import { MemoryCache } from '@/lib/cache/memory-cache';
import { applyAuthReadRateLimit } from '@/lib/auth/auth-rate-limit'
import { resolveUserPrimaryMembershipWithOrg } from '@/lib/services/user-org-context.service'

// ⚡ OPTIMIZACIÓN: Cache de organizaciones (5MB, 5min TTL)
interface CachedOrganizationData {
  organization: {
    id: string
    name: string
    logo_url?: string | null
    brand_logo_url?: string | null
    brand_favicon_url?: string | null
    favicon_url?: string | null
    slug?: string | null
  } | null
  jobTitle: string | null
  jobDescription: string | null
}

const orgCache = new MemoryCache<CachedOrganizationData>(5, 5 * 60 * 1000);

export async function GET(request: Request) {
  try {
    const user = await SessionService.getCurrentUser();
    const rateLimitResponse = applyAuthReadRateLimit(request, user?.id ?? null)

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado'
      }, {
        status: 401,
        headers: cacheHeaders.private // NO cachear - datos sensibles
      });
    }

    // ⚡ OPTIMIZACIÓN: Buscar organización con cache y query simplificada
    let organization = null;
    let jobDescription: string | null = null;
    let jobTitle: string | null = null; // Cargo/puesto del usuario en la organización

    // Verificar cache primero
    const cacheKey = `user-org:${user.id}`;
    const cachedOrg = orgCache.get(cacheKey);

    if (cachedOrg) {
      organization = cachedOrg.organization;
      jobDescription = cachedOrg.jobDescription;
      jobTitle = cachedOrg.jobTitle;
    } else {
      try {
        const supabase = await createClient();
        const membership = await resolveUserPrimaryMembershipWithOrg(supabase, user.id);

        if (membership) {
          const org = membership.organizations;
          organization = {
            id: org.id,
            name: org.name,
            logo_url: org.logo_url,
            brand_logo_url: org.brand_logo_url,
            brand_favicon_url: org.brand_favicon_url,
            favicon_url: org.brand_favicon_url,
            slug: org.slug
          };
          jobTitle = membership.job_title || null;
          jobDescription = membership.job_description || null;
        }

        if (organization) {
          orgCache.set(cacheKey, { organization, jobTitle, jobDescription });
        }
      } catch (orgError) {
        logger.error('Error resolving user organization context:', orgError);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        organization_id: organization?.id || null, // ID directo para acceso fácil en hooks
        organization: organization, // Información completa de la organización (opcional)
        job_description: jobDescription,
        job_title: jobTitle // Cargo/puesto del usuario en la organización (antes type_rol)
      }
    }, {
      headers: cacheHeaders.private // NO cachear - datos de usuario
    });
  } catch (error) {
    logger.error('Error getting current user:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno'
    }, { status: 500 });
  }
}
