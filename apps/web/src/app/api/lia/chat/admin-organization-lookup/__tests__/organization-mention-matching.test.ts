import { describe, expect, it } from 'vitest'
import {
  extractOrganizationIdentifiers,
  findMentionedOrganizations,
  mentionsOrganizationVocabulary,
  mentionsTerm,
  normalizeForMention,
} from '../organization-mention-matching'
import type { OrganizationCatalogEntry } from '../types'

const CATALOG: OrganizationCatalogEntry[] = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Art in Technology', slug: 'art-in-technology' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Acme', slug: 'acme' },
  { id: '33333333-3333-4333-8333-333333333333', name: 'Acme Global', slug: 'acme-global' },
  { id: '44444444-4444-4444-8444-444444444444', name: 'Constructora Ñandú', slug: 'constructora-nandu' },
]

function mention(message: string) {
  return findMentionedOrganizations(
    extractOrganizationIdentifiers([message]),
    CATALOG,
  ).map((entry) => entry.name)
}

describe('normalizeForMention', () => {
  it('quita acentos, mayúsculas y separadores', () => {
    expect(normalizeForMention('Constructora Ñandú')).toBe('constructora nandu')
    expect(normalizeForMention('art-in-technology')).toBe('art in technology')
    expect(normalizeForMention('  ¡ACME!  ')).toBe('acme')
  })
})

describe('mentionsTerm', () => {
  it('exige coincidencia por palabras completas', () => {
    expect(mentionsTerm('la empresa acme crece', 'acme')).toBe(true)
    expect(mentionsTerm('acmecorp crece', 'acme')).toBe(false)
  })

  it('descarta términos demasiado cortos para ser una mención fiable', () => {
    expect(mentionsTerm('el area de ia', 'ia')).toBe(false)
  })
})

describe('findMentionedOrganizations', () => {
  it('detecta el nombre aunque no encaje en ningún patrón de nombre propio', () => {
    expect(
      mention('cuando empezaron la primera leccion la mayoria de participantes en Art in Technology?'),
    ).toEqual(['Art in Technology'])
  })

  it('detecta por slug y sin acentos', () => {
    expect(mention('dame el detalle de constructora nandu')).toEqual([
      'Constructora Ñandú',
    ])
    expect(mention('revisa art-in-technology por favor')).toEqual([
      'Art in Technology',
    ])
  })

  it('detecta por UUID explícito', () => {
    expect(mention('progreso de 22222222-2222-4222-8222-222222222222')).toEqual([
      'Acme',
    ])
  })

  it('resuelve el nombre más específico cuando uno contiene al otro', () => {
    expect(mention('cuantos usuarios tiene Acme Global')).toEqual(['Acme Global'])
  })

  it('devuelve todas las organizaciones nombradas para poder desambiguar', () => {
    // El orden lo marca la especificidad de la coincidencia, no el mensaje.
    expect(mention('compara Acme con Art in Technology').sort()).toEqual([
      'Acme',
      'Art in Technology',
    ])
  })

  it('no inventa organizaciones que no están en el catálogo', () => {
    expect(mention('dame el reporte de Globex Corporation')).toEqual([])
  })

  it('no confunde una parte del nombre con el nombre completo', () => {
    expect(mention('revisa Technology Partners')).toEqual([])
  })

  it('prioriza el mensaje más reciente que menciona una organización', () => {
    const identifiers = extractOrganizationIdentifiers([
      'hablemos de Acme',
      'ahora mírame Art in Technology',
    ])
    expect(
      findMentionedOrganizations(identifiers, CATALOG).map((entry) => entry.name),
    ).toEqual(['Art in Technology'])
  })
})

describe('mentionsOrganizationVocabulary', () => {
  it('reconoce preguntas sobre empresas sin nombrar ninguna', () => {
    expect(mentionsOrganizationVocabulary(['¿cuántas empresas hay activas?'])).toBe(true)
    expect(mentionsOrganizationVocabulary(['¿qué cliente usa más licencias?'])).toBe(true)
    expect(mentionsOrganizationVocabulary(['dame las organizaciones del plan enterprise'])).toBe(true)
  })

  it('no se activa con preguntas ajenas a las organizaciones', () => {
    expect(mentionsOrganizationVocabulary(['¿cómo creo un curso nuevo?'])).toBe(false)
    expect(mentionsOrganizationVocabulary([])).toBe(false)
  })

  it('solo mira el mensaje actual, no el historial', () => {
    expect(
      mentionsOrganizationVocabulary([
        '¿cuántas empresas hay?',
        '¿cómo exporto un certificado?',
      ]),
    ).toBe(false)
  })
})
