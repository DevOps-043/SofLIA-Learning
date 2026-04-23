import { buildNameMap, incrementLookupCounter } from './map-utils'
import type { CountMap, SupabaseServerClient } from './shared-types'

function createDemographicsBucket() {
  return {
    byRole: {} as CountMap,
    byLevel: {} as CountMap,
    byArea: {} as CountMap,
    bySector: {} as CountMap,
    byCompanySize: {} as CountMap,
    byRelation: {} as CountMap,
    verifiedUsers: 0,
  }
}

export async function getDemographics(
  supabase: SupabaseServerClient,
  userIds: string[],
) {
  const demographics = createDemographicsBucket()
  if (!userIds.length) return demographics

  const [
    { data: profiles },
    { data: verified },
    rolesRes,
    levelsRes,
    areasRes,
    sectorsRes,
    sizesRes,
    relationsRes,
  ] = await Promise.all([
    supabase
      .from('user_perfil')
      .select('rol_id, nivel_id, area_id, sector_id, tamano_id, relacion_id')
      .in('user_id', userIds),
    supabase.from('users').select('id').in('id', userIds).eq('email_verified', true),
    supabase.from('roles').select('id, nombre'),
    supabase.from('niveles').select('id, nombre'),
    supabase.from('areas').select('id, nombre'),
    supabase.from('sectores').select('id, nombre'),
    supabase.from('tamanos_empresa').select('id, nombre'),
    supabase.from('relaciones').select('id, nombre'),
  ])

  const lookups = {
    roles: buildNameMap(rolesRes.data),
    levels: buildNameMap(levelsRes.data),
    areas: buildNameMap(areasRes.data),
    sectors: buildNameMap(sectorsRes.data),
    sizes: buildNameMap(sizesRes.data),
    relations: buildNameMap(relationsRes.data),
  }

  demographics.verifiedUsers = verified?.length || 0
  ;(profiles ?? []).forEach((profile) => {
    incrementLookupCounter(demographics.byRole, profile.rol_id, lookups.roles, 'Sin rol')
    incrementLookupCounter(demographics.byLevel, profile.nivel_id, lookups.levels, 'Sin nivel')
    incrementLookupCounter(demographics.byArea, profile.area_id, lookups.areas, 'Sin area')
    incrementLookupCounter(demographics.bySector, profile.sector_id, lookups.sectors, 'Sin sector')
    incrementLookupCounter(demographics.byCompanySize, profile.tamano_id, lookups.sizes, 'Sin tamano')
    incrementLookupCounter(demographics.byRelation, profile.relacion_id, lookups.relations, 'Sin relacion')
  })

  return demographics
}
