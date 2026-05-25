import { describe, expect, it } from 'vitest'
import {
  createCompanySlug,
  createInitialCompanyData,
  getSelectedPlan,
  isCreateCompanyFormValid,
  updateCompanyColor,
} from '../admin-create-company-modal/service'

describe('admin-create-company-modal.service', () => {
  it('genera slug estable desde el nombre', () => {
    expect(createCompanySlug('Acme Corp 2026!')).toBe('acme-corp-2026')
  })

  it('valida el formulario minimo requerido', () => {
    const form = createInitialCompanyData()
    expect(isCreateCompanyFormValid(form)).toBe(false)

    form.name = 'Acme'
    form.owner_email = 'owner@acme.com'
    expect(isCreateCompanyFormValid(form)).toBe(true)
  })

  it('resuelve el plan seleccionado y actualiza colores', () => {
    const form = createInitialCompanyData()
    expect(getSelectedPlan('business').value).toBe('business')
    expect(
      updateCompanyColor(form, 'brand_color_primary', 'var(--color-bg-light)')
        .brand_color_primary,
    ).toBe('var(--color-bg-light)')
  })
})
