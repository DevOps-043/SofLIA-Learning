/**
 * Servicio para obtener información de organizaciones por slug
 */

import { createClient } from '@/lib/supabase/server';

export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  description: string | null;
  subscription_plan: 'team' | 'business' | 'enterprise';
  subscription_status: 'active' | 'expired' | 'cancelled' | 'trial' | 'pending';
  billing_cycle?: 'monthly' | 'yearly' | null;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  max_users?: number;
  is_active: boolean;
  brand_color_primary?: string | null;
  brand_color_secondary?: string | null;
  brand_color_accent?: string | null;
  brand_font_family?: string | null;
  brand_logo_url?: string | null;
  brand_favicon_url?: string | null;
  google_login_enabled?: boolean;
  microsoft_login_enabled?: boolean;
}

/**
 * Obtiene una organización por su slug
 * @param slug Slug de la organización
 * @returns Organización o null si no se encuentra
 */
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .ilike('slug', slug.trim())
      .single();

    if (error || !data) {
      return null;
    }

    return data as Organization;
  } catch (error) {
    return null;
  }
}

/**
 * Obtiene una organización por su ID
 * @param id ID de la organización
 * @returns Organización o null si no se encuentra
 */
export async function getOrganizationById(id: string): Promise<Organization | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Organization;
  } catch (error) {
    return null;
  }
}

/**
 * Verifica si un slug de organización está disponible
 * @param slug Slug a verificar
 * @returns true si está disponible, false si no
 */
export async function isOrganizationSlugAvailable(slug: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single();

    // Si hay error o no hay datos, el slug está disponible
    return error !== null || !data;
  } catch (error) {
    return false;
  }
}

