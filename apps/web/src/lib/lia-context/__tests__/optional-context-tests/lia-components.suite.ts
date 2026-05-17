import { LIA_DATA_ATTRIBUTES, liaComponent, liaDataTable, liaErrorBoundary, liaForm, liaMarker, liaModal } from '../../utils/lia-component'
import { check } from './assertions'
import { createResult } from './types'

export function testLiaComponentUtilities() {
  console.log('
TEST: LIA COMPONENT UTILITIES
')
  const result = createResult()
  const basic = liaComponent({ name: 'TestComponent' })
  const withProps = liaComponent({ name: 'Card', props: { id: '123', isOpen: true }, state: 'active' })
  const marker = liaMarker('Button', 'disabled')
  const modalOpen = liaModal('ConfirmDialog', true)
  const modalClosed = liaModal('ConfirmDialog', false)
  const form = liaForm('LoginForm', { step: 2, hasErrors: true })
  const table = liaDataTable('UsersTable', { itemCount: 50, page: 2, hasFilters: true })
  const sensitiveProps = liaComponent({ name: 'LoginForm', props: { email: 'test@example.com', password: 'secret123', token: 'abc123', normalProp: 'visible' } })

  check(result, basic[LIA_DATA_ATTRIBUTES.COMPONENT] === 'TestComponent', 'liaComponent genera atributo correcto', 'liaComponent no genera atributo correcto')
  check(result, Boolean(withProps[LIA_DATA_ATTRIBUTES.PROPS]), 'liaComponent incluye props', 'liaComponent no incluye props')
  check(result, marker[LIA_DATA_ATTRIBUTES.COMPONENT] === 'Button' && marker[LIA_DATA_ATTRIBUTES.STATE] === 'disabled', 'liaMarker funciona', 'liaMarker no funciona')
  check(result, modalOpen[LIA_DATA_ATTRIBUTES.STATE] === 'open' && modalClosed[LIA_DATA_ATTRIBUTES.STATE] === 'closed', 'liaModal maneja estados', 'liaModal no maneja estados')
  check(result, Boolean(form[LIA_DATA_ATTRIBUTES.STATE]?.includes('step-2') && form[LIA_DATA_ATTRIBUTES.STATE]?.includes('has-errors')), 'liaForm genera estado', 'liaForm no genera estado')
  check(result, Boolean(table[LIA_DATA_ATTRIBUTES.STATE]?.includes('items-50') && table[LIA_DATA_ATTRIBUTES.STATE]?.includes('filtered')), 'liaDataTable genera estado', 'liaDataTable no genera estado')
  check(result, liaErrorBoundary('AppBoundary')[LIA_DATA_ATTRIBUTES.ERROR_BOUNDARY] === 'true', 'liaErrorBoundary marca boundary', 'liaErrorBoundary no marca boundary')
  check(result, !String(sensitiveProps[LIA_DATA_ATTRIBUTES.PROPS] || '').includes('secret123'), 'Props sensibles sanitizadas', 'Props sensibles no sanitizadas')
  check(result, LIA_DATA_ATTRIBUTES.COMPONENT === 'data-lia-component' && LIA_DATA_ATTRIBUTES.STATE === 'data-lia-state', 'Constantes correctas', 'Constantes incorrectas')
  check(result, Boolean(liaDataTable('DataGrid', { isLoading: true })[LIA_DATA_ATTRIBUTES.STATE]?.includes('loading')), 'liaDataTable soporta loading', 'liaDataTable no soporta loading')
  check(result, Boolean(liaForm('PaymentForm', { isSubmitting: true })[LIA_DATA_ATTRIBUTES.STATE]?.includes('submitting')), 'liaForm soporta submitting', 'liaForm no soporta submitting')
  return result
}
