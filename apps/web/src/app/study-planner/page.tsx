import { redirect } from 'next/navigation';
import { SessionService } from '../../features/auth/services/session.service';
import { createClient } from '../../lib/supabase/server';

/**
 * Study Planner Root Page
 * 
 * Este componente es el punto de entrada para /study-planner.
 * Maneja la redirección condicional:
 * - Si el usuario tiene un plan activo, redirige al dashboard.
 * - Si no tiene un plan, redirige a la creación del plan.
 */
export default async function StudyPlannerPage() {
  // Obtener usuario actual
  const user = await SessionService.getCurrentUser();

  if (!user) {
    redirect('/auth');
  }

  // Crear cliente de Supabase (browser/server client según el contexto de Next.js)
  const supabase = await createClient();

  // Verificar si el usuario tiene un plan activo
  const { data: activePlan } = await supabase
    .from('study_plans')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Redirección condicional
  if (activePlan) {
    // Si tiene plan, ir al dashboard (que contiene el calendario)
    redirect('/study-planner/dashboard');
  } else {
    // Si no tiene plan, ir a la página de creación
    redirect('/study-planner/create');
  }
}
