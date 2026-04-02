import { describe, expect, it } from 'vitest'
import {
  buildAddCommunityPayload,
  buildCommunitySlug,
  createDefaultAddCommunityFormData,
  normalizeCommunityCourses,
  validateAddCommunityForm,
} from '../add-community-modal.service'

describe('add-community-modal.service', () => {
  it('creates normalized slugs without accents or duplicate hyphens', () => {
    expect(buildCommunitySlug('Comunidad de Diseño Ágil')).toBe(
      'comunidad-de-diseno-agil',
    )
    expect(buildCommunitySlug(' IA   avanzada !! ')).toBe('ia-avanzada')
  })

  it('validates required fields and slug format', () => {
    const errors = validateAddCommunityForm({
      ...createDefaultAddCommunityFormData(),
      slug: 'Slug Invalido',
    })

    expect(errors).toEqual({
      name: 'El nombre es requerido',
      description: 'La descripcion es requerida',
      slug: 'Solo letras minusculas, numeros y guiones',
    })
  })

  it('normalizes valid courses and drops invalid entries', () => {
    expect(
      normalizeCommunityCourses([
        { id: 'course-1', title: 'IA', instructor_name: 'Ada' },
        { id: '', title: 'Invalido' },
        null,
      ]),
    ).toEqual([{ id: 'course-1', title: 'IA', instructor_name: 'Ada' }])
  })

  it('builds a trimmed payload and nulls optional empty values', () => {
    expect(
      buildAddCommunityPayload({
        ...createDefaultAddCommunityFormData(),
        name: ' Comunidad IA ',
        description: ' Automatizacion ',
        slug: 'comunidad-ia',
      }),
    ).toEqual({
      name: 'Comunidad IA',
      description: 'Automatizacion',
      slug: 'comunidad-ia',
      image_url: null,
      is_active: true,
      visibility: 'public',
      access_type: 'open',
      course_id: null,
    })
  })
})
