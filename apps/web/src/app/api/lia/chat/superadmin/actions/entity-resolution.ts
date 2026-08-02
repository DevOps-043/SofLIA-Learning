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

export interface ResolvedTargetLearningPath {
  id: string
  title: string
  isActive: boolean
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

type TargetUserRow = {
  id: string
  email: string | null
  display_name: string | null
  first_name: string | null
  last_name: string | null
  username: string | null
  is_banned: boolean | null
  platform_role: string | null
}

const TARGET_USER_COLUMNS =
  'id, email, display_name, first_name, last_name, username, is_banned, platform_role'

function mapTargetUser(row: TargetUserRow): ResolvedTargetUser {
  return {
    id: row.id,
    email: row.email,
    displayName: buildDisplayName(row),
    isBanned: row.is_banned === true,
    platformRole: row.platform_role,
  }
}

async function findTargetUserCandidates(identifier: string): Promise<ResolvedTargetUser[]> {
  const supabase = createAdminClient()
  const trimmed = identifier.trim()
  const query = supabase.from('users').select(TARGET_USER_COLUMNS)

  if (UUID_PATTERN.test(trimmed)) {
    const { data } = await query.eq('id', trimmed).maybeSingle()
    return data ? [mapTargetUser(data as TargetUserRow)] : []
  }

  if (trimmed.includes('@')) {
    const { data } = await query.ilike('email', trimmed).maybeSingle()
    return data ? [mapTargetUser(data as TargetUserRow)] : []
  }

  // Los comodines de LIKE nunca se aceptan desde el modelo.
  if (/[%_]/.test(trimmed)) return []

  const nameParts = trimmed.split(/\s+/).filter(Boolean)
  const lookups = [
    supabase.from('users').select(TARGET_USER_COLUMNS).ilike('display_name', trimmed).limit(5),
    supabase.from('users').select(TARGET_USER_COLUMNS).ilike('username', trimmed).limit(5),
  ]
  if (nameParts.length >= 2) {
    lookups.push(
      supabase
        .from('users')
        .select(TARGET_USER_COLUMNS)
        .ilike('first_name', nameParts[0])
        .ilike('last_name', nameParts.slice(1).join(' '))
        .limit(5),
    )
  }

  const results = await Promise.all(lookups)
  const unique = new Map<string, ResolvedTargetUser>()
  for (const result of results) {
    for (const row of (result.data ?? []) as TargetUserRow[]) {
      unique.set(row.id, mapTargetUser(row))
    }
  }
  return [...unique.values()]
}

/** Resuelve un usuario por UUID, email, username o nombre exacto; ambigüedad = abortar. */
export async function resolveTargetUser(
  identifier: string,
): Promise<ResolvedTargetUser> {
  const trimmed = identifier.trim()
  const candidates = await findTargetUserCandidates(trimmed)
  if (candidates.length === 0) {
    throw new EntityNotFoundError(
      `No existe ningún usuario con el identificador "${trimmed}".`,
    )
  }
  if (candidates.length > 1) {
    throw new EntityNotFoundError(
      `Hay varios usuarios llamados "${trimmed}". Indica su email para evitar afectar a la persona equivocada.`,
    )
  }
  return candidates[0]
}

/** Resuelve un usuario y exige que tenga membresía activa en el tenant indicado. */
export async function resolveOrganizationMember(
  identifier: string,
  organizationId: string,
): Promise<ResolvedTargetUser> {
  const candidates = await findTargetUserCandidates(identifier)
  if (candidates.length === 0) {
    throw new EntityNotFoundError(
      `No existe ningún usuario con el identificador "${identifier.trim()}".`,
    )
  }
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('organization_users')
    .select('user_id, status')
    .eq('organization_id', organizationId)
    .in('user_id', candidates.map((candidate) => candidate.id))
    .eq('status', 'active')
    .limit(2)

  if (error || !data?.length) {
    throw new EntityNotFoundError(
      `El usuario "${identifier.trim()}" no es un miembro activo de la organización seleccionada.`,
    )
  }
  if (data.length > 1) {
    throw new EntityNotFoundError(
      `Hay varios miembros llamados "${identifier.trim()}". Indica el email exacto.`,
    )
  }

  const user = candidates.find((candidate) => candidate.id === data[0].user_id)
  if (!user) throw new EntityNotFoundError('No se pudo resolver al miembro de la organización.')
  return user
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

/** Resuelve una ruta de aprendizaje activa por UUID, slug o título exacto. */
export async function resolveTargetLearningPath(
  identifier: string,
): Promise<ResolvedTargetLearningPath> {
  const supabase = createAdminClient()
  const trimmed = identifier.trim()
  const lookupColumns: Array<'id' | 'slug' | 'title'> = UUID_PATTERN.test(trimmed)
    ? ['id']
    : ['slug', 'title']

  for (const column of lookupColumns) {
    const { data } = await supabase
      .from('learning_paths')
      .select('id, title, is_active')
      .eq(column, trimmed)
      .maybeSingle()

    if (data) {
      return { id: data.id, title: data.title, isActive: data.is_active === true }
    }
  }

  throw new EntityNotFoundError(
    `No existe ninguna ruta de aprendizaje con el identificador "${trimmed}".`,
  )
}
