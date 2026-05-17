import type { createClient } from '@/lib/supabase/server'
import type { ImportContext, ParsedImportUserRow } from './types'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export async function getExistingUserImportError(
  supabase: SupabaseServerClient,
  userData: ParsedImportUserRow,
  context: ImportContext,
) {
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email, username')
    .or(`email.eq.${userData.email},username.eq.${userData.username}`)
    .maybeSingle()

  if (!existingUser) return null

  const { data: existingOrgUser } = await supabase
    .from('organization_users')
    .select('role')
    .eq('organization_id', context.organizationId)
    .eq('user_id', existingUser.id)
    .maybeSingle()

  if (existingOrgUser) {
    return {
      error: `Este usuario ya es miembro de tu organizaciÃ³n (Rol: ${existingOrgUser.role}).`,
      data: { ...userData, existing_role: existingOrgUser.role },
    }
  }

  return {
    error:
      'Este correo ya estÃ¡ registrado en la plataforma pero NO en tu organizaciÃ³n. Por favor utiliza la opciÃ³n "Invitar" para agregarlo a tu equipo.',
    data: userData,
  }
}
