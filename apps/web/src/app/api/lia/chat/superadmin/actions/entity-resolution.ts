import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Resolución de entidades objetivo contra la base de datos.
 *
 * Regla de seguridad: los identificadores que emite el modelo NUNCA se usan
 * directamente en una mutación. Siempre se resuelven aquí primero, de modo que:
 *   - una entidad inexistente aborta la acción antes de pedir confirmación;
 *   - el resumen que confirma el admin muestra el NOMBRE REAL de la entidad
 *     afectada (no el identificador que el modelo creyó correcto), lo que hace
 *     visible cualquier confusión del modelo antes de ejecutar.
 */

export class EntityNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EntityNotFoundError'
  }
}

export interface ResolvedTargetUser {
  id: string
  email: string | null
  displayName: string
  isBanned: boolean
  platformRole: string | null
}

export interface ResolvedTargetOrganization {
  id: string
  name: string
  slug: string | null
  brandingEnabled: boolean
}

export interface ResolvedTargetCourse {
  id: string
  title: string
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function buildDisplayName(row: {
  display_name: string | null
  first_name: string | null
  last_name: string | null
  username: string | null
}): string {
  return (
    row.display_name ||
    [row.first_name, row.last_name].filter(Boolean).join(' ') ||
    row.username ||
    'sin nombre'
  )
}

/** Resuelve un usuario por UUID o por email exacto. */
export async function resolveTargetUser(
  identifier: string,
): Promise<ResolvedTargetUser> {
  const supabase = createAdminClient()
  const trimmed = identifier.trim()

  const query = supabase
    .from('users')
    .select('id, email, display_name, first_name, last_name, username, is_banned, platform_role')

  const { data, error } = UUID_PATTERN.test(trimmed)
    ? await query.eq('id', trimmed).maybeSingle()
    : await query.ilike('email', trimmed).maybeSingle()

  if (error || !data) {
    throw new EntityNotFoundError(
      `No existe ningún usuario con el identificador "${trimmed}".`,
    )
  }

  return {
    id: data.id,
    email: data.email,
    displayName: buildDisplayName(data),
    isBanned: data.is_banned === true,
    platformRole: data.platform_role,
  }
}

/**
 * Resuelve una organización por UUID, slug exacto o nombre exacto.
 *
 * Se usan filtros `.eq()` separados en lugar de `.or('slug.eq.X,name.eq.X')`:
 * la sintaxis de `.or()` se construye por interpolación de texto, así que un
 * identificador con comas o paréntesis podría alterar el filtro (inyección en
 * PostgREST). `.eq()` va parametrizado y no admite esa manipulación.
 */
export async function resolveTargetOrganization(
  identifier: string,
): Promise<ResolvedTargetOrganization> {
  const supabase = createAdminClient()
  const trimmed = identifier.trim()
  const columns = 'id, name, slug, branding_enabled'

  const lookupColumns: Array<'id' | 'slug' | 'name'> = UUID_PATTERN.test(trimmed)
    ? ['id']
    : ['slug', 'name']

  for (const column of lookupColumns) {
    const { data } = await supabase
      .from('organizations')
      .select(columns)
      .eq(column, trimmed)
      .maybeSingle()

    if (data) {
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        brandingEnabled: data.branding_enabled === true,
      }
    }
  }

  throw new EntityNotFoundError(
    `No existe ninguna organización con el identificador "${trimmed}".`,
  )
}

/** Resuelve un curso por UUID, slug exacto o título exacto (mismo criterio anti-inyección). */
export async function resolveTargetCourse(
  identifier: string,
): Promise<ResolvedTargetCourse> {
  const supabase = createAdminClient()
  const trimmed = identifier.trim()

  const lookupColumns: Array<'id' | 'slug' | 'title'> = UUID_PATTERN.test(trimmed)
    ? ['id']
    : ['slug', 'title']

  for (const column of lookupColumns) {
    const { data } = await supabase
      .from('courses')
      .select('id, title')
      .eq(column, trimmed)
      .maybeSingle()

    if (data) {
      return { id: data.id, title: data.title }
    }
  }

  throw new EntityNotFoundError(
    `No existe ningún curso con el identificador "${trimmed}".`,
  )
}
