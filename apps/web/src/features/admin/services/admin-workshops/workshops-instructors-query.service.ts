import { createClient } from '../../../../lib/supabase/server'

export async function getInstructors(): Promise<Array<{ id: string, name: string }>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, first_name, last_name')
    .in('cargo_rol', ['Instructor', 'Administrador'])
    .order('display_name')

  if (error) throw error

  return (data || []).map((user) => ({
    id: user.id,
    name: user.display_name ||
      `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
      'Instructor sin nombre',
  }))
}
