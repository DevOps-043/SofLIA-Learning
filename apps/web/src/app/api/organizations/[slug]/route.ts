import { NextRequest, NextResponse } from 'next/server';
import { getPublicAuthOrganizationBySlug } from '@/features/auth/services/organization.service';
import { canUseCustomLogin } from '@/lib/organization-auth';
import { logger } from '@/lib/logger';

/**
 * GET /api/organizations/[slug]
 * Obtiene información de una organización por su slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Slug de organización requerido' },
        { status: 400 }
      );
    }

    // Obtener organización por slug
    const organization = await getPublicAuthOrganizationBySlug(slug);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si puede usar login personalizado
    if (!canUseCustomLogin(organization)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Esta organización no tiene acceso a login personalizado',
          reason: 'subscription_invalid'
        },
        { status: 403 }
      );
    }

    // Retornar información de la organización (sin datos sensibles)
    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo_url: organization.brand_logo_url || organization.logo_url,
        description: organization.description,
        brand_color_primary: organization.brand_color_primary,
        brand_color_secondary: organization.brand_color_secondary,
        brand_color_accent: organization.brand_color_accent,
        brand_font_family: organization.brand_font_family,
        brand_favicon_url: organization.brand_favicon_url,
        google_login_enabled: organization.google_login_enabled,
        microsoft_login_enabled: organization.microsoft_login_enabled,
        login_styles: organization.login_styles || null,
      }
    });
  } catch (error) {
    logger.error('Error en GET /api/organizations/[slug]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener organización' },
      { status: 500 }
    );
  }
}
