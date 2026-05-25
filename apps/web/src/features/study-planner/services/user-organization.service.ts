import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * UserOrganizationService
 *
 * Handles organization info and work-team membership for B2B users.
 */

import { createClient } from '../../../lib/supabase/server';
import type {
  OrganizationInfo,
  WorkTeam,
} from '../types/user-context.types';
import { mapOrganizationInfo, mapWorkTeam } from './user-organization.mapper';

export class UserOrganizationService {
  /**
   * Obtiene la información de la organización del usuario (solo B2B)
   */
  static async getUserOrganization(userId: string): Promise<OrganizationInfo | null> {
    const supabase = await createClient();

    // Buscar en organization_users (tabla de relación para B2B)
    const { data: orgUserData, error: orgUserError } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (orgUserError) {
      techDebtLogger.error('❌ [getUserOrganization] Error buscando en organization_users:', orgUserError);
      return null;
    }

    if (!orgUserData?.organization_id) {
      return null;
    }

    // Obtener información de la organización
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        logo_url,
        subscription_plan,
        max_users
      `)
      .eq('id', orgUserData.organization_id)
      .single();

    if (error) {
      techDebtLogger.error('Error obteniendo organización:', error);
      return null;
    }

    return mapOrganizationInfo(data);
  }

  /**
   * Obtiene los equipos de trabajo del usuario (solo B2B)
   */
  static async getUserWorkTeams(userId: string): Promise<WorkTeam[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('work_team_members')
      .select(`
        role,
        status,
        work_teams:team_id (
          team_id,
          name,
          description,
          course_id
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      techDebtLogger.error('Error obteniendo equipos de trabajo:', error);
      return [];
    }

    return data.map(mapWorkTeam);
  }
}
