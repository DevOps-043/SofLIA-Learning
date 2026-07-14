import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * UserIdentityService
 *
 * Handles user type detection, basic info, and professional profile.
 */

import { createClient } from '../../../lib/supabase/server';
import type {
  UserType,
  UserBasicInfo,
  UserProfessionalProfile,
} from '../types/user-context.types';

export class UserIdentityService {
  /**
   * Determina si el usuario es B2B o B2C basado en la tabla organizations_users
   */
  static async getUserType(userId: string): Promise<UserType> {
    const supabase = await createClient();

    // Verificar si el usuario existe en organizations_users (es B2B)
    const { data, error } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      techDebtLogger.error('❌ [getUserType] Error de Supabase:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        userId,
      });
      throw new Error(`No se pudo determinar el tipo de usuario: ${error.message} (code: ${error.code})`);
    }

    // Si existe registro en organizations_users, es B2B
    const userType = data?.organization_id ? 'b2b' : 'b2c';

    return userType;
  }

  /**
   * Obtiene la información básica del usuario
   */
  static async getUserBasicInfo(userId: string): Promise<UserBasicInfo> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        email,
        first_name,
        last_name,
        display_name,
        profile_picture_url,
        cargo_rol
      `)
      .eq('id', userId)
      .single();

    if (error) {
      techDebtLogger.error('Error obteniendo información básica del usuario:', error);
      throw new Error('No se pudo obtener la información del usuario');
    }

    return {
      id: data.id,
      username: data.username ?? undefined,
      email: data.email ?? undefined,
      firstName: data.first_name ?? undefined,
      lastName: data.last_name ?? undefined,
      displayName: data.display_name ?? undefined,
      profilePictureUrl: data.profile_picture_url ?? undefined,
      cargoRol: data.cargo_rol ?? undefined,
    };
  }

  /**
   * Obtiene el perfil profesional completo del usuario
   * con JOINs a roles, areas, niveles, tamanos_empresa, sectores, relaciones
   */
  static async getUserProfile(userId: string): Promise<UserProfessionalProfile | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_perfil')
      .select(`
        cargo_titulo,
        rol_id,
        nivel_id,
        area_id,
        relacion_id,
        tamano_id,
        sector_id,
        pais,
        dificultad_id,
        uso_ia_respuesta,
        roles:rol_id (id, slug, nombre, area_id),
        niveles:nivel_id (id, slug, nombre),
        areas:area_id (id, slug, nombre),
        relaciones:relacion_id (id, slug, nombre),
        tamanos_empresa:tamano_id (id, slug, nombre, min_empleados, max_empleados),
        sectores:sector_id (id, slug, nombre)
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No existe perfil, retornar null
        return null;
      }
      techDebtLogger.error('Error obteniendo perfil del usuario:', error);
      return null;
    }

    const profile: UserProfessionalProfile = {
      cargoTitulo: data.cargo_titulo ?? undefined,
      pais: data.pais ?? undefined,
      dificultadId: data.dificultad_id ?? undefined,
      usoIaRespuesta: data.uso_ia_respuesta ?? undefined,
    };

    // Mapear rol
    if (data.roles && typeof data.roles === 'object' && !Array.isArray(data.roles)) {
      const rol = data.roles as { id: number; slug: string; nombre: string; area_id?: number };
      profile.rol = {
        id: rol.id,
        slug: rol.slug,
        nombre: rol.nombre,
        areaId: rol.area_id,
      };
    }

    // Mapear nivel
    if (data.niveles && typeof data.niveles === 'object' && !Array.isArray(data.niveles)) {
      const nivel = data.niveles as { id: number; slug: string; nombre: string };
      profile.nivel = {
        id: nivel.id,
        slug: nivel.slug,
        nombre: nivel.nombre,
      };
    }

    // Mapear área
    if (data.areas && typeof data.areas === 'object' && !Array.isArray(data.areas)) {
      const area = data.areas as { id: number; slug: string; nombre: string };
      profile.area = {
        id: area.id,
        slug: area.slug,
        nombre: area.nombre,
      };
    }

    // Mapear relación
    if (data.relaciones && typeof data.relaciones === 'object' && !Array.isArray(data.relaciones)) {
      const relacion = data.relaciones as { id: number; slug: string; nombre: string };
      profile.relacion = {
        id: relacion.id,
        slug: relacion.slug,
        nombre: relacion.nombre,
      };
    }

    // Mapear tamaño de empresa
    if (data.tamanos_empresa && typeof data.tamanos_empresa === 'object' && !Array.isArray(data.tamanos_empresa)) {
      const tamano = data.tamanos_empresa as { id: number; slug: string; nombre: string; min_empleados?: number; max_empleados?: number };
      profile.tamanoEmpresa = {
        id: tamano.id,
        slug: tamano.slug,
        nombre: tamano.nombre,
        minEmpleados: tamano.min_empleados,
        maxEmpleados: tamano.max_empleados,
      };
    }

    // Mapear sector
    if (data.sectores && typeof data.sectores === 'object' && !Array.isArray(data.sectores)) {
      const sector = data.sectores as { id: number; slug: string; nombre: string };
      profile.sector = {
        id: sector.id,
        slug: sector.slug,
        nombre: sector.nombre,
      };
    }

    return profile;
  }
}
