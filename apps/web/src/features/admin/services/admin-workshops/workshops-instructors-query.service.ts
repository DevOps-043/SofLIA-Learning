import { createAdminClient } from '../../../../lib/supabase/admin'

export async function getInstructors(): Promise<Array<{ id: string, name: string }>> {
  // La RLS de `users` solo expone filas propias o de miembros de una org que
  // el llamante administra; un instructor sin organización quedaría oculto
  // incluso para un super-admin. Ruta ya autorizada por requireAdmin().
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, first_name, last_name')
    .in('platform_role', ['Instructor', 'Administrador'])
    .order('display_name')

  if (error) throw error

  return (data || []).map((user) => ({
    id: user.id,
    name: user.display_name ||
      `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
      'Instructor sin nombre',
  }))
}
