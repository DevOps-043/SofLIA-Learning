import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { DeterministicPlannerEngine } from '@/features/study-planner-v3/services/deterministic-engine.service';
import { LearningObligation, PolicyVersion } from '@/features/study-planner-v3/types/planner.types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const supabase = await createClient();

    // 1. Obtener la organización del usuario
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', currentUser.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (!orgUser || !orgUser.organization_id) {
      return NextResponse.json({ success: false, error: 'No perteneces a una organización activa' }, { status: 403 });
    }

    const organizationId = orgUser.organization_id;

    // 2. Obtener la política por defecto de la organización
    const { data: defaultPolicy } = await supabase
      .from('planner_policies')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('name', 'Política de Cumplimiento General')
      .maybeSingle();

    if (!defaultPolicy || !defaultPolicy.active_version_id) {
      return NextResponse.json({ success: false, error: 'La organización no tiene una política V3 configurada (Seed faltante)' }, { status: 400 });
    }

    const { data: policyVersionData } = await supabase
      .from('planner_policy_versions')
      .select('*')
      .eq('id', defaultPolicy.active_version_id)
      .maybeSingle();

    if (!policyVersionData) {
      return NextResponse.json({ success: false, error: 'La versión de la política no se encontró.' }, { status: 400 });
    }

    const policyVersion: PolicyVersion = {
      id: policyVersionData.id,
      policyId: defaultPolicy.id,
      organizationId: organizationId,
      version: policyVersionData.version,
      rules: typeof policyVersionData.rules === 'string' ? JSON.parse(policyVersionData.rules) : policyVersionData.rules
    };

    // 3. Obtener obligaciones (Asignaciones)
    const { data: assignments, error: assignmentsError } = await supabase
      .from('organization_course_assignments')
      .select(`
        id,
        course_id,
        due_date,
        hard_due_date,
        soft_due_date,
        grace_period_days,
        compliance_mode,
        status,
        exempted_at,
        assigned_at,
        courses:course_id ( id, title )
      `)
      .eq('user_id', currentUser.id)
      .eq('organization_id', organizationId)
      .neq('status', 'cancelled');

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      return NextResponse.json({ success: false, error: 'Error obteniendo obligaciones' }, { status: 500 });
    }

    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    // Transformar a formato LearningObligation
    const obligations: LearningObligation[] = (assignments || []).map((a: any) => ({
      id: a.id,
      organizationId: organizationId,
      userId: currentUser.id,
      courseId: a.course_id,
      startDate: a.assigned_at,
      hardDueDate: a.hard_due_date || a.due_date || oneYearFromNow.toISOString(), 
      softDueDate: a.soft_due_date,
      gracePeriodDays: a.grace_period_days || policyVersion.rules.defaultGracePeriodDays || 7,
      complianceMode: a.compliance_mode || 'flexible',
      status: a.status === 'completed' ? 'completed' : (a.exempted_at ? 'exempted' : 'active'),
      completedAt: a.status === 'completed' ? new Date().toISOString() : null,
      exemptedAt: a.exempted_at,
      courseTitle: Array.isArray(a.courses) ? a.courses[0]?.title : (a.courses?.title || 'Curso sin título')
    } as LearningObligation & { courseTitle: string }));

    // 4. Ejecutar Motor Determinista Síncrono (Generación al vuelo del plan de cumplimiento)
    const { evaluatedObligations } = DeterministicPlannerEngine.generatePlan(
      organizationId,
      currentUser.id,
      obligations,
      policyVersion
    );

    // Sumarizar estadísticas
    const stats = {
      on_track: 0,
      due_soon: 0,
      overdue: 0,
      completed: 0,
      waived: 0
    };

    const dashboardItems = evaluatedObligations.map(eo => {
      // Usar status para estados
      if (eo.complianceState === 'on_track') stats.on_track++;
      else if (eo.complianceState === 'due_soon') stats.due_soon++;
      else if (eo.complianceState === 'overdue') stats.overdue++;
      else if (eo.complianceState === 'completed') stats.completed++;
      else if (eo.complianceState === 'waived') stats.waived++;

      const obl = obligations.find(o => o.id === eo.id) as any;
      return {
        ...eo,
        courseTitle: obl.courseTitle
      };
    });

    return NextResponse.json({
      success: true,
      stats,
      data: dashboardItems
    });

  } catch (error: any) {
    console.error('Error in V3 Dashboard API:', error);
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
