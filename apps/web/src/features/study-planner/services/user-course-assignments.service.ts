/**
 * UserCourseAssignmentsService
 *
 * Handles B2B course assignments (org + team/hierarchy),
 * B2C course purchases, unified course list, and upcoming deadlines.
 */

import { createClient } from '../../../lib/supabase/server';
import type {
  UserType,
  CourseAssignment,
  B2BCourseAssignment,
  B2CCoursePurchase,
  TeamCourseAssignment,
} from '../types/user-context.types';

export class UserCourseAssignmentsService {
  /**
   * Obtiene los cursos asignados a un usuario B2B por la organización
   */
  static async getB2BCourseAssignments(userId: string): Promise<B2BCourseAssignment[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('organization_course_assignments')
      .select(`
        id,
        organization_id,
        user_id,
        course_id,
        assigned_by,
        assigned_at,
        due_date,
        status,
        completion_percentage,
        completed_at,
        message,
        courses:course_id (
          id,
          title,
          description,
          slug,
          category,
          level,
          instructor_id,
          thumbnail_url,
          duration_total_minutes,
          is_active,
          price,
          average_rating,
          student_count
        ),
        assigner:assigned_by (
          display_name,
          first_name,
          last_name
        )
      `)
      .eq('user_id', userId)
      .neq('status', 'cancelled');

    if (error) {
      console.error('Error obteniendo asignaciones de cursos B2B:', error);
      return [];
    }

    // ✅ FIX: Filtrar asignaciones cuya fecha límite ya pasó
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validData = data.filter((item) => {
      // Si no tiene due_date, incluir (sin fecha límite)
      if (!item.due_date) return true;

      const dueDate = new Date(item.due_date);
      dueDate.setHours(0, 0, 0, 0);

      const isValid = dueDate >= today;
      if (!isValid) {
      }
      return isValid;
    });

    return validData.map((item) => {
      const course = item.courses as unknown as {
        id: string;
        title: string;
        description?: string;
        slug: string;
        category: string;
        level: string;
        instructor_id?: string;
        thumbnail_url?: string;
        duration_total_minutes: number;
        is_active: boolean;
        price?: number;
        average_rating?: number;
        student_count?: number;
      };

      const assigner = item.assigner as unknown as {
        display_name?: string;
        first_name?: string;
        last_name?: string;
      } | null;

      return {
        id: item.id,
        organizationId: item.organization_id,
        userId: item.user_id,
        courseId: item.course_id,
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          slug: course.slug,
          category: course.category,
          level: course.level as 'beginner' | 'intermediate' | 'advanced',
          instructorId: course.instructor_id,
          thumbnailUrl: course.thumbnail_url,
          durationTotalMinutes: course.duration_total_minutes,
          isActive: course.is_active,
          price: course.price,
          averageRating: course.average_rating,
          studentCount: course.student_count,
        },
        assignedBy: item.assigned_by,
        assignedByName: assigner?.display_name ||
          (assigner?.first_name && assigner?.last_name
            ? `${assigner.first_name} ${assigner.last_name}`
            : undefined),
        assignedAt: item.assigned_at,
        dueDate: item.due_date,
        status: item.status as B2BCourseAssignment['status'],
        completionPercentage: item.completion_percentage,
        completedAt: item.completed_at,
        message: item.message,
      };
    });
  }

  /**
   * Obtiene los cursos asignados por equipos de trabajo (B2B)
   * Actualizado para usar la nueva estructura jerárquica
   */
  static async getTeamCourseAssignments(userId: string): Promise<TeamCourseAssignment[]> {
    const supabase = await createClient();

    // Obtener información jerárquica del usuario
    const { data: orgUser, error: orgUserError } = await supabase
      .from('organization_users')
      .select('organization_id, team_id, zone_id, region_id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (orgUserError || !orgUser || !orgUser.organization_id) {
      // Si no está en organización, intentar con sistema antiguo como fallback
      return this.getLegacyTeamCourseAssignments(userId);
    }

    // Determinar qué entidad jerárquica tiene el usuario
    let entityType: 'region' | 'zone' | 'team' | null = null;
    let entityId: string | null = null;

    if (orgUser.team_id) {
      entityType = 'team';
      entityId = orgUser.team_id;
    } else if (orgUser.zone_id) {
      entityType = 'zone';
      entityId = orgUser.zone_id;
    } else if (orgUser.region_id) {
      entityType = 'region';
      entityId = orgUser.region_id;
    }

    if (!entityType || !entityId) {
      return [];
    }

    // Obtener IDs de asignaciones para la entidad del usuario
    let assignmentIds: string[] = [];

    if (entityType === 'team') {
      const { data: teamAssignments } = await supabase
        .from('team_course_assignments')
        .select('hierarchy_assignment_id')
        .eq('team_id', entityId);
      assignmentIds = teamAssignments?.map(a => a.hierarchy_assignment_id) || [];
    } else if (entityType === 'zone') {
      const { data: zoneAssignments } = await supabase
        .from('zone_course_assignments')
        .select('hierarchy_assignment_id')
        .eq('zone_id', entityId);
      assignmentIds = zoneAssignments?.map(a => a.hierarchy_assignment_id) || [];
    } else {
      // region
      const { data: regionAssignments } = await supabase
        .from('region_course_assignments')
        .select('hierarchy_assignment_id')
        .eq('region_id', entityId);
      assignmentIds = regionAssignments?.map(a => a.hierarchy_assignment_id) || [];
    }

    if (assignmentIds.length === 0) {
      return [];
    }

    // Obtener asignaciones jerárquicas
    const { data, error } = await supabase
      .from('hierarchy_course_assignments')
      .select(`
        id,
        course_id,
        assigned_by,
        assigned_at,
        due_date,
        status,
        message,
        courses:course_id (
          id,
          title,
          description,
          slug,
          category,
          level,
          instructor_id,
          thumbnail_url,
          duration_total_minutes,
          is_active,
          price,
          average_rating,
          student_count
        ),
        assigner:assigned_by (
          display_name,
          first_name,
          last_name
        )
      `)
      .eq('organization_id', orgUser.organization_id)
      .in('id', assignmentIds)
      .in('status', ['active']);

    if (error) {
      console.error('Error obteniendo asignaciones jerárquicas:', error);
      // Fallback al sistema antiguo
      return this.getLegacyTeamCourseAssignments(userId);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Obtener información de entidades para mapear nombres
    let entityName = '';
    if (entityType === 'team') {
      const { data: teamData } = await supabase
        .from('organization_teams')
        .select('name')
        .eq('id', entityId)
        .single();
      entityName = teamData?.name || 'Equipo';
    } else if (entityType === 'zone') {
      const { data: zoneData } = await supabase
        .from('organization_zones')
        .select('name')
        .eq('id', entityId)
        .single();
      entityName = zoneData?.name || 'Zona';
    } else {
      const { data: regionData } = await supabase
        .from('organization_regions')
        .select('name')
        .eq('id', entityId)
        .single();
      entityName = regionData?.name || 'Región';
    }

    return data.map((item: any) => {

      const course = item.courses as any;
      const assigner = item.assigner as any;

      return {
        id: item.id,
        teamId: entityId,
        teamName: entityName,
        courseId: item.course_id,
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          slug: course.slug,
          category: course.category,
          level: course.level as 'beginner' | 'intermediate' | 'advanced',
          instructorId: course.instructor_id,
          thumbnailUrl: course.thumbnail_url,
          durationTotalMinutes: course.duration_total_minutes,
          isActive: course.is_active,
          price: course.price,
          averageRating: course.average_rating,
          studentCount: course.student_count,
        },
        assignedBy: item.assigned_by,
        assignedByName: assigner?.display_name ||
          (assigner?.first_name && assigner?.last_name
            ? `${assigner.first_name} ${assigner.last_name}`
            : undefined),
        assignedAt: item.assigned_at,
        dueDate: item.due_date,
        status: (item.status === 'active' ? 'assigned' : item.status) as TeamCourseAssignment['status'],
        message: item.message,
      };
    });
  }

  /**
   * Método legacy para obtener asignaciones del sistema antiguo (fallback)
   * @deprecated Usar getTeamCourseAssignments que ahora usa la nueva estructura
   */
  private static async getLegacyTeamCourseAssignments(userId: string): Promise<TeamCourseAssignment[]> {
    const supabase = await createClient();

    // Primero obtener los equipos del usuario (sistema antiguo)
    const { data: teams, error: teamsError } = await supabase
      .from('work_team_members')
      .select('team_id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (teamsError || !teams || teams.length === 0) {
      return [];
    }

    const teamIds = teams.map(t => t.team_id);

    // Obtener asignaciones de cursos de esos equipos (sistema antiguo)
    const { data, error } = await supabase
      .from('work_team_course_assignments')
      .select(`
        id,
        team_id,
        course_id,
        assigned_by,
        assigned_at,
        due_date,
        status,
        message,
        work_teams:team_id (
          name
        ),
        courses:course_id (
          id,
          title,
          description,
          slug,
          category,
          level,
          instructor_id,
          thumbnail_url,
          duration_total_minutes,
          is_active,
          price,
          average_rating,
          student_count
        ),
        assigner:assigned_by (
          display_name,
          first_name,
          last_name
        )
      `)
      .in('team_id', teamIds)
      .neq('status', 'completed');

    if (error) {
      console.error('Error obteniendo asignaciones de equipos (legacy):', error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((item) => {
      const team = item.work_teams as unknown as { name: string };
      const course = item.courses as unknown as {
        id: string;
        title: string;
        description?: string;
        slug: string;
        category: string;
        level: string;
        instructor_id?: string;
        thumbnail_url?: string;
        duration_total_minutes: number;
        is_active: boolean;
        price?: number;
        average_rating?: number;
        student_count?: number;
      };

      const assigner = item.assigner as unknown as {
        display_name?: string;
        first_name?: string;
        last_name?: string;
      } | null;

      return {
        id: item.id,
        teamId: item.team_id,
        teamName: team.name,
        courseId: item.course_id,
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          slug: course.slug,
          category: course.category,
          level: course.level as 'beginner' | 'intermediate' | 'advanced',
          instructorId: course.instructor_id,
          thumbnailUrl: course.thumbnail_url,
          durationTotalMinutes: course.duration_total_minutes,
          isActive: course.is_active,
          price: course.price,
          averageRating: course.average_rating,
          studentCount: course.student_count,
        },
        assignedBy: item.assigned_by,
        assignedByName: assigner?.display_name ||
          (assigner?.first_name && assigner?.last_name
            ? `${assigner.first_name} ${assigner.last_name}`
            : undefined),
        assignedAt: item.assigned_at,
        dueDate: item.due_date,
        status: item.status as TeamCourseAssignment['status'],
        message: item.message,
      };
    });
  }

  /**
   * Obtiene los cursos adquiridos por un usuario B2C
   */
  static async getB2CCoursePurchases(userId: string): Promise<B2CCoursePurchase[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('course_purchases')
      .select(`
        purchase_id,
        user_id,
        course_id,
        purchased_at,
        access_status,
        expires_at,
        courses:course_id (
          id,
          title,
          description,
          slug,
          category,
          level,
          instructor_id,
          thumbnail_url,
          duration_total_minutes,
          is_active,
          price,
          average_rating,
          student_count
        )
      `)
      .eq('user_id', userId)
      .eq('access_status', 'active');

    if (error) {
      console.error('Error obteniendo compras de cursos B2C:', error);
      return [];
    }

    // Obtener progreso de enrollments
    const courseIds = data.map(d => d.course_id);
    const { data: enrollments } = await supabase
      .from('user_course_enrollments')
      .select('course_id, progress_percentage')
      .eq('user_id', userId)
      .in('course_id', courseIds);

    const progressMap = new Map(
      (enrollments || []).map(e => [e.course_id, e.progress_percentage])
    );

    return data.map((item) => {
      const course = item.courses as unknown as {
        id: string;
        title: string;
        description?: string;
        slug: string;
        category: string;
        level: string;
        instructor_id?: string;
        thumbnail_url?: string;
        duration_total_minutes: number;
        is_active: boolean;
        price?: number;
        average_rating?: number;
        student_count?: number;
      };

      return {
        purchaseId: item.purchase_id,
        userId: item.user_id,
        courseId: item.course_id,
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          slug: course.slug,
          category: course.category,
          level: course.level as 'beginner' | 'intermediate' | 'advanced',
          instructorId: course.instructor_id,
          thumbnailUrl: course.thumbnail_url,
          durationTotalMinutes: course.duration_total_minutes,
          isActive: course.is_active,
          price: course.price,
          averageRating: course.average_rating,
          studentCount: course.student_count,
        },
        purchasedAt: item.purchased_at,
        accessStatus: item.access_status as B2CCoursePurchase['accessStatus'],
        expiresAt: item.expires_at,
        completionPercentage: progressMap.get(item.course_id) || 0,
      };
    });
  }

  /**
   * Obtiene los cursos del usuario según su tipo (B2B o B2C)
   */
  static async getUserCourses(userId: string, userType: UserType): Promise<CourseAssignment[]> {
    if (userType === 'b2b') {
      // Obtener asignaciones de organización y de equipos
      const [orgAssignments, teamAssignments] = await Promise.all([
        this.getB2BCourseAssignments(userId),
        this.getTeamCourseAssignments(userId),
      ]);

      // Convertir a formato unificado
      const courses: CourseAssignment[] = [];

      // Agregar asignaciones de organización
      for (const assignment of orgAssignments) {
        courses.push({
          courseId: assignment.courseId,
          course: assignment.course,
          userType: 'b2b',
          dueDate: assignment.dueDate,
          assignedBy: assignment.assignedByName,
          status: assignment.status,
          completionPercentage: assignment.completionPercentage,
          source: 'organization',
        });
      }

      // Agregar asignaciones de equipo (evitar duplicados)
      for (const assignment of teamAssignments) {
        const exists = courses.some(c => c.courseId === assignment.courseId);
        if (!exists) {
          courses.push({
            courseId: assignment.courseId,
            course: assignment.course,
            userType: 'b2b',
            dueDate: assignment.dueDate,
            assignedBy: assignment.assignedByName,
            status: assignment.status,
            completionPercentage: 0,
            source: 'team',
          });
        }
      }

      return courses;
    } else {
      // B2C: obtener cursos comprados
      const purchases = await this.getB2CCoursePurchases(userId);

      return purchases.map(purchase => ({
        courseId: purchase.courseId,
        course: purchase.course,
        userType: 'b2c',
        status: purchase.accessStatus,
        completionPercentage: purchase.completionPercentage || 0,
        source: 'purchase',
      }));
    }
  }

  /**
   * Verifica si el usuario tiene cursos con plazos próximos (B2B)
   */
  static async getUpcomingDeadlines(userId: string, daysAhead: number = 14): Promise<B2BCourseAssignment[]> {
    const supabase = await createClient();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data, error } = await supabase
      .from('organization_course_assignments')
      .select(`
        id,
        organization_id,
        user_id,
        course_id,
        assigned_by,
        assigned_at,
        due_date,
        status,
        completion_percentage,
        completed_at,
        message,
        courses:course_id (
          id,
          title,
          description,
          slug,
          category,
          level,
          instructor_id,
          thumbnail_url,
          duration_total_minutes,
          is_active
        )
      `)
      .eq('user_id', userId)
      .not('due_date', 'is', null)
      .lt('due_date', futureDate.toISOString())
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error obteniendo plazos próximos:', error);
      return [];
    }

    return data.map((item) => {
      const course = item.courses as unknown as {
        id: string;
        title: string;
        description?: string;
        slug: string;
        category: string;
        level: string;
        instructor_id?: string;
        thumbnail_url?: string;
        duration_total_minutes: number;
        is_active: boolean;
      };

      return {
        id: item.id,
        organizationId: item.organization_id,
        userId: item.user_id,
        courseId: item.course_id,
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          slug: course.slug,
          category: course.category,
          level: course.level as 'beginner' | 'intermediate' | 'advanced',
          instructorId: course.instructor_id,
          thumbnailUrl: course.thumbnail_url,
          durationTotalMinutes: course.duration_total_minutes,
          isActive: course.is_active,
        },
        assignedBy: item.assigned_by,
        assignedAt: item.assigned_at,
        dueDate: item.due_date,
        status: item.status as B2BCourseAssignment['status'],
        completionPercentage: item.completion_percentage,
        completedAt: item.completed_at,
        message: item.message,
      };
    });
  }
}
