import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '../../../../lib/supabase/server'
import { sanitizeSlug, generateUniqueSlugAsync } from '../../../../lib/slug'
import { AuditLogService } from '../auditLog.service'
import {
  deleteWorkshopHierarchy,
  WorkshopDeletionError,
} from './workshop-deletion.service'
import type { AdminWorkshop } from './workshops-transform.service'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';
import type { Json, Tables, TablesInsert, TablesUpdate } from '@/lib/supabase/types'

type CourseRow = Tables<'courses'>

function parseLearningObjectives(value: Json | AdminWorkshop['learning_objectives']): string[] | null {
  if (!Array.isArray(value)) {
    return null
  }

  const objectives = value.filter((objective): objective is string => typeof objective === 'string') as string[]
  return objectives.length > 0 ? objectives : null
}

function approvalStatusFromRow(value: string | null): AdminWorkshop['approval_status'] {
  return value === 'approved' || value === 'rejected' || value === 'pending'
    ? value
    : undefined
}

function toAdminWorkshop(row: CourseRow): AdminWorkshop {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    category: row.category,
    level: row.level,
    duration_total_minutes: row.duration_total_minutes ?? 0,
    instructor_id: row.instructor_id ?? '',
    is_active: row.is_active ?? false,
    thumbnail_url: row.thumbnail_url ?? undefined,
    slug: row.slug,
    price: row.price ?? undefined,
    average_rating: row.average_rating ?? undefined,
    student_count: row.student_count ?? 0,
    review_count: row.review_count ?? 0,
    learning_objectives: parseLearningObjectives(row.learning_objectives),
    approval_status: approvalStatusFromRow(row.approval_status),
    approved_by: row.approved_by ?? undefined,
    approved_at: row.approved_at ?? undefined,
    rejection_reason: row.rejection_reason ?? undefined,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

function auditValues(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }

  return value as Record<string, unknown>
}

export class AdminWorkshopsMutationService {
  static async createWorkshop(workshopData: Partial<AdminWorkshop>, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<AdminWorkshop> {

    const supabase = await createClient()

    try {
      // Seguridad: sanitizar y generar slug unico
      let slug: string;

      if (workshopData.slug) {
        slug = sanitizeSlug(workshopData.slug);
      } else if (workshopData.title) {
        slug = sanitizeSlug(workshopData.title);
      } else {
        throw new Error('Se requiere titulo o slug para crear el taller');
      }

      // Verificar unicidad
      slug = await generateUniqueSlugAsync(slug, async (testSlug) => {
        const { data } = await supabase
          .from('courses')
          .select('slug')
          .eq('slug', testSlug)
          .single();
        return !!data;
      });

      const insertData: TablesInsert<'courses'> = {
        title: workshopData.title ?? '',
        description: workshopData.description,
        category: workshopData.category,
        level: workshopData.level,
        duration_total_minutes: workshopData.duration_total_minutes,
        instructor_id: workshopData.instructor_id,
        is_active: workshopData.is_active || false,
        thumbnail_url: workshopData.thumbnail_url,
        slug,
        price: workshopData.price,
        average_rating: 0,
        student_count: 0,
        review_count: 0,
        learning_objectives: workshopData.learning_objectives,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('courses')
        .insert(insertData)
        .select(`
          id,
          title,
          description,
          category,
          level,
          duration_total_minutes,
          instructor_id,
          is_active,
          thumbnail_url,
          slug,
          price,
          average_rating,
          student_count,
          review_count,
          learning_objectives,
          approval_status,
          approved_by,
          approved_at,
          rejection_reason,
          created_at,
          updated_at
        `)
        .single()

      if (error) {
        techDebtLogger.error('[AdminWorkshopsService.createWorkshop] Error creando curso en BD:', error);
        throw error
      }

      await AuditLogService.logAction({
        user_id: adminUserId,
        admin_user_id: adminUserId,
        action: 'CREATE',
        table_name: 'courses',
        record_id: data.id,
        old_values: undefined,
        new_values: auditValues(workshopData),
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })

      // Traducir automaticamente el curso a ingles y portugues
      try {

        const translationModule = await import('../../../../core/services/courseTranslation.service');
        const { translateCourseOnCreate } = translationModule;

        const courseDataForTranslation = {
          title: data.title || '',
          description: data.description || null,
          learning_objectives: parseLearningObjectives(data.learning_objectives)
        };

        const translationResult = await translateCourseOnCreate(
          data.id,
          courseDataForTranslation,
          adminUserId,
          supabase
        );


        if (!translationResult.success) {
          techDebtLogger.error('[AdminWorkshopsService] La traduccion NO fue exitosa');
          techDebtLogger.error('[AdminWorkshopsService] Errores:', translationResult.errors);
        } else {

        }

      } catch (translationError) {
        // No fallar la creacion del curso si falla la traduccion
        techDebtLogger.error('[AdminWorkshopsService] ========== ERROR EN TRADUCCION ==========');
        techDebtLogger.error('[AdminWorkshopsService] EXCEPCION en traduccion automatica del curso');
        techDebtLogger.error('[AdminWorkshopsService] Tipo de error:', translationError?.constructor?.name || typeof translationError);
        if (translationError instanceof Error) {
          techDebtLogger.error('[AdminWorkshopsService] Mensaje:', translationError.message);
          techDebtLogger.error('[AdminWorkshopsService] Stack trace:', translationError.stack);
        } else {
          techDebtLogger.error('[AdminWorkshopsService] Error (no es instancia de Error):', JSON.stringify(translationError, null, 2));
        }
      }

      return toAdminWorkshop(data)
    } catch (error) {
      throw error
    }
  }

  static async updateWorkshop(workshopId: string, workshopData: Partial<AdminWorkshop>, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<AdminWorkshop> {
    const supabase = await createClient()

    try {
      // Obtener datos anteriores para el log de auditoria
      const { data: oldData } = await supabase
        .from('courses')
        .select(SELECT_COLUMNS.courses)
        .eq('id', workshopId)
        .single()

      // Preparar datos de actualizacion
      const updateData: TablesUpdate<'courses'> = {
        updated_at: new Date().toISOString()
      }

      // Campos basicos
      if (workshopData.title !== undefined) updateData.title = workshopData.title
      if (workshopData.description !== undefined) updateData.description = workshopData.description
      if (workshopData.category !== undefined) updateData.category = workshopData.category
      if (workshopData.level !== undefined) updateData.level = workshopData.level
      if (workshopData.duration_total_minutes !== undefined) updateData.duration_total_minutes = workshopData.duration_total_minutes
      if (workshopData.instructor_id !== undefined) updateData.instructor_id = workshopData.instructor_id
      if (workshopData.is_active !== undefined) updateData.is_active = workshopData.is_active
      if (workshopData.thumbnail_url !== undefined) updateData.thumbnail_url = workshopData.thumbnail_url
      if (workshopData.slug !== undefined) updateData.slug = workshopData.slug
      if (workshopData.price !== undefined) updateData.price = workshopData.price
      if (workshopData.learning_objectives !== undefined) updateData.learning_objectives = workshopData.learning_objectives

      // Campos de aprobacion
      if (workshopData.approval_status !== undefined) {
        updateData.approval_status = workshopData.approval_status

        if (workshopData.approval_status === 'approved') {
          updateData.approved_by = adminUserId
          updateData.approved_at = new Date().toISOString()
          updateData.rejection_reason = null
        }

        if (workshopData.approval_status === 'rejected') {
          updateData.approved_by = null
          updateData.approved_at = null
        }

        if (workshopData.approval_status === 'pending') {
          updateData.approved_by = null
          updateData.approved_at = null
          updateData.rejection_reason = null
        }
      }

      if (workshopData.rejection_reason !== undefined) {
        updateData.rejection_reason = workshopData.rejection_reason
      }

      const { data, error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', workshopId)
        .select(`
          id,
          title,
          description,
          category,
          level,
          duration_total_minutes,
          instructor_id,
          is_active,
          thumbnail_url,
          slug,
          price,
          average_rating,
          student_count,
          review_count,
          learning_objectives,
          approval_status,
          approved_by,
          approved_at,
          rejection_reason,
          created_at,
          updated_at
        `)
        .single()

      if (error) {
        throw error
      }

      await AuditLogService.logAction({
        user_id: adminUserId,
        admin_user_id: adminUserId,
        action: 'UPDATE',
        table_name: 'courses',
        record_id: workshopId,
        old_values: auditValues(oldData),
        new_values: auditValues(workshopData),
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })

      return toAdminWorkshop(data)
    } catch (error) {
      throw error
    }
  }

  static async deleteWorkshop(workshopId: string, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<void> {
    const supabase = await createClient()

    try {
      // Obtener datos del taller antes de eliminarlo para el log de auditoria
      const { data: workshopData } = await supabase
        .from('courses')
        .select(SELECT_COLUMNS.courses)
        .eq('id', workshopId)
        .single()

      if (!workshopData) {
        throw new WorkshopDeletionError('Taller no encontrado', 404)
      }

      // Eliminar la jerarquia completa del taller y todas sus dependencias
      await deleteWorkshopHierarchy(supabase, workshopId)

      try {
        await AuditLogService.logAction({
          user_id: adminUserId,
          admin_user_id: adminUserId,
          action: 'DELETE',
          table_name: 'courses',
          record_id: workshopId,
          old_values: workshopData,
          new_values: undefined,
          ip_address: requestInfo?.ip,
          user_agent: requestInfo?.userAgent
        })
      } catch (auditLogError) {
        techDebtLogger.error('No se pudo registrar el borrado del taller en audit_logs:', auditLogError)
      }
    } catch (error) {
      techDebtLogger.error('Error in AdminWorkshopsService.deleteWorkshop:', error)
      throw error
    }
  }
}
