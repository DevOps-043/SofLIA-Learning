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
      console.error('❌ [getUserOrganization] Error buscando en organization_users:', orgUserError);
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
      console.error('Error obteniendo organización:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      logoUrl: data.logo_url,
      // industry no existe en la tabla, usar null
      industry: null,
      // size no existe, usar max_users como referencia
      size: data.max_users ? `${data.max_users} usuarios` : null,
      plan: data.subscription_plan,
    };
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
      console.error('Error obteniendo equipos de trabajo:', error);
      return [];
    }

    return data.map((item) => {
      const team = item.work_teams as unknown as {
        team_id: string;
        name: string;
        description?: string;
        course_id?: string;
      };

      return {
        teamId: team.team_id,
        name: team.name,
        description: team.description,
        role: item.role as 'member' | 'leader' | 'co-leader',
        status: item.status as 'active' | 'inactive',
        courseId: team.course_id,
      };
    });
  }
}
