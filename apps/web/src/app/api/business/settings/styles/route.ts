import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { getThemeById, generateBrandingTheme } from '@/features/business-panel/config/preset-themes';
import { DESIGN_HEX_COLOR } from '@/core/theme/color-tokens'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import {
  businessStylesUpdateSchema,
  businessThemeApplySchema,
  type BusinessStylesUpdateBody,
  type BusinessThemeApplyBody,
} from './schema'

interface ThemeStyleInput {
  background_type: 'image' | 'color' | 'gradient';
  background_value: string;
  primary_button_color: string;
  secondary_button_color: string;
  accent_color: string;
  [key: string]: unknown;
}

interface OrganizationStylesRow {
  panel_styles?: ThemeStyleInput | null;
  user_dashboard_styles?: ThemeStyleInput | null;
  login_styles?: ThemeStyleInput | null;
  selected_theme?: string | null;
  brand_color_primary?: string | null;
  brand_color_secondary?: string | null;
  brand_color_accent?: string | null;
}

export async function GET(request: NextRequest) {
  try {

    const auth = await requireBusiness();
    if (auth instanceof NextResponse) {

      return auth;
    }

    const { organizationId } = auth;

    const supabase = await createClient();

    if (!organizationId) {

      return NextResponse.json(
        { success: false, error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    // Obtener estilos de la organización
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('panel_styles, user_dashboard_styles, login_styles, selected_theme')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      techDebtLogger.error('❌ [API] Error obteniendo organización:', orgError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener estilos' },
        { status: 500 }
      );
    }


    // Si hay un tema seleccionado pero no hay estilos guardados, aplicar el tema preset
    let panelStyles = organization.panel_styles;
    let userDashboardStyles = organization.user_dashboard_styles;
    let loginStyles = organization.login_styles;

    if (organization.selected_theme && (!panelStyles || !userDashboardStyles || !loginStyles)) {
      const theme = getThemeById(organization.selected_theme);
      if (theme) {
        panelStyles = panelStyles || theme.panel;
        userDashboardStyles = userDashboardStyles || theme.userDashboard;
        loginStyles = loginStyles || theme.login;
      }
    }

    // Obtener si el tema soporta modo dual
    let supportsDualMode = false;
    if (organization.selected_theme) {
      const theme = getThemeById(organization.selected_theme);
      if (theme) {
        supportsDualMode = theme.supportsDualMode || false;
      }
    }

    return NextResponse.json({
      success: true,
      styles: {
        panel: panelStyles || null,
        userDashboard: userDashboardStyles || null,
        login: loginStyles || null,
        selectedTheme: organization.selected_theme || null,
        supportsDualMode
      }
    });
  } catch (error: unknown) {
    techDebtLogger.error('❌ [API] Error en GET /api/business/settings/styles:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estilos' },
      { status: 500 }
    );
  }
}

export const POST = withZodBody(businessThemeApplySchema, handlePost)

async function handlePut(
  _request: NextRequest,
  body: BusinessStylesUpdateBody,
  _context: unknown,
) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    const { organizationId } = auth;
    const supabase = await createClient();

    const { panel, userDashboard, login } = body;

    if (!organizationId) {
      return apiError('NO_ORGANIZATION', 'Organización no encontrada', 404);
    }

    // Construir objeto de actualización
    const updateData: Partial<OrganizationStylesRow> = {};
    if (panel !== undefined) updateData.panel_styles = panel;
    if (userDashboard !== undefined) updateData.user_dashboard_styles = userDashboard;
    if (login !== undefined) updateData.login_styles = login;

    // Actualizar estilos
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)
      .select('panel_styles, user_dashboard_styles, login_styles, selected_theme')
      .single();

    if (updateError || !updatedOrg) {
      return apiError('UPDATE_STYLES_FAILED', 'Error al actualizar estilos', 500);
    }

    // Obtener si el tema soporta modo dual
    let supportsDualMode = false;
    if (updatedOrg.selected_theme) {
      const theme = getThemeById(updatedOrg.selected_theme);
      if (theme) {
        supportsDualMode = theme.supportsDualMode || false;
      }
    }

    return NextResponse.json({
      success: true,
      styles: {
        panel: updatedOrg.panel_styles || null,
        userDashboard: updatedOrg.user_dashboard_styles || null,
        login: updatedOrg.login_styles || null,
        selectedTheme: updatedOrg.selected_theme || null,
        supportsDualMode
      }
    });
  } catch (error: unknown) {
    return apiError('UPDATE_STYLES_FAILED', 'Error al actualizar estilos', 500);
  }
}

export const PUT = withZodBody(businessStylesUpdateSchema, handlePut)

async function handlePost(
  _request: NextRequest,
  body: BusinessThemeApplyBody,
  _context: unknown,
) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    const { organizationId } = auth;
    const supabase = await createClient();

    const { themeId } = body;

    if (!organizationId) {
      return apiError('NO_ORGANIZATION', 'Organización no encontrada', 404);
    }

    // Obtener tema predefinido o generar tema de branding
    let theme;

    if (themeId === 'branding-personalizado') {
      // Para tema de branding, necesitamos obtener los colores de branding primero
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('brand_color_primary, brand_color_secondary, brand_color_accent')
        .eq('id', organizationId)
        .single();

      if (orgError || !orgData) {
        return apiError(
          'BRANDING_COLORS_NOT_FOUND',
          'No se pudieron obtener los colores de branding',
          500,
        );
      }

      // Generar tema desde colores de branding
      theme = generateBrandingTheme({
        color_primary: orgData.brand_color_primary || DESIGN_HEX_COLOR.info,
        color_secondary: orgData.brand_color_secondary || DESIGN_HEX_COLOR.success,
        color_accent: orgData.brand_color_accent || DESIGN_HEX_COLOR.secondary
      });
    } else {
      // Obtener tema predefinido
      theme = getThemeById(themeId);
      if (!theme) {
        return apiError('THEME_NOT_FOUND', 'Tema no encontrado', 404);
      }
    }

    // Aplicar tema
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update({
        panel_styles: theme.panel,
        user_dashboard_styles: theme.userDashboard,
        login_styles: theme.login,
        selected_theme: themeId
      })
      .eq('id', organizationId)
      .select('panel_styles, user_dashboard_styles, login_styles, selected_theme')
      .single();

    if (updateError || !updatedOrg) {
      return apiError('APPLY_THEME_FAILED', 'Error al aplicar tema', 500);
    }

    return NextResponse.json({
      success: true,
      styles: {
        panel: updatedOrg.panel_styles || null,
        userDashboard: updatedOrg.user_dashboard_styles || null,
        login: updatedOrg.login_styles || null,
        selectedTheme: updatedOrg.selected_theme || null,
        supportsDualMode: theme.supportsDualMode || false
      }
    });
  } catch (error: unknown) {
    return apiError('APPLY_THEME_FAILED', 'Error al aplicar tema', 500);
  }
}
