import {
  LIA_DATA_ATTRIBUTES,
  liaComponent,
  liaDataTable,
  liaErrorBoundary,
  liaForm,
  liaMarker,
  liaModal,
} from '../../utils/lia-component'
import { createCounter } from './test-runner'

export function testLiaComponentUtilities() {
  console.log('\nTEST: LIA COMPONENT UTILITIES\n')
  const counter = createCounter()

  const basic = liaComponent({ name: 'TestComponent' })
  counter.check(basic[LIA_DATA_ATTRIBUTES.COMPONENT] === 'TestComponent', 'liaComponent genera atributo correcto', 'liaComponent no genera atributo correcto')
  const withProps = liaComponent({ name: 'Card', props: { id: '123', isOpen: true }, state: 'active' })
  counter.check(Boolean(withProps[LIA_DATA_ATTRIBUTES.PROPS]), 'liaComponent incluye props', 'liaComponent no incluye props')
  const marker = liaMarker('Button', 'disabled')
  counter.check(marker[LIA_DATA_ATTRIBUTES.COMPONENT] === 'Button' && marker[LIA_DATA_ATTRIBUTES.STATE] === 'disabled', 'liaMarker genera nombre y estado', 'liaMarker no funciona')
  const modalOpen = liaModal('ConfirmDialog', true)
  const modalClosed = liaModal('ConfirmDialog', false)
  counter.check(modalOpen[LIA_DATA_ATTRIBUTES.STATE] === 'open' && modalClosed[LIA_DATA_ATTRIBUTES.STATE] === 'closed', 'liaModal maneja estados', 'liaModal no maneja estados')
  const form = liaForm('LoginForm', { step: 2, hasErrors: true })
  counter.check(Boolean(form[LIA_DATA_ATTRIBUTES.STATE]?.includes('step-2') && form[LIA_DATA_ATTRIBUTES.STATE]?.includes('has-errors')), 'liaForm genera estado', 'liaForm no genera estado')
  const table = liaDataTable('UsersTable', { itemCount: 50, page: 2, hasFilters: true })
  counter.check(Boolean(table[LIA_DATA_ATTRIBUTES.STATE]?.includes('items-50') && table[LIA_DATA_ATTRIBUTES.STATE]?.includes('filtered')), 'liaDataTable genera estado', 'liaDataTable no genera estado')
  counter.check(liaErrorBoundary('AppBoundary')[LIA_DATA_ATTRIBUTES.ERROR_BOUNDARY] === 'true', 'liaErrorBoundary marca error boundary', 'liaErrorBoundary no marca')

  const sensitiveProps = liaComponent({ name: 'LoginForm', props: { email: 'test@example.com', password: 'secret123', token: 'abc123', normalProp: 'visible' } })
  const propsStr = sensitiveProps[LIA_DATA_ATTRIBUTES.PROPS] || ''
  counter.check(!propsStr.includes('password') && !propsStr.includes('token') && !propsStr.includes('secret123'), 'Props sensibles sanitizadas', 'Props sensibles no se sanitizan')
  counter.check(LIA_DATA_ATTRIBUTES.COMPONENT === 'data-lia-component' && LIA_DATA_ATTRIBUTES.STATE === 'data-lia-state', 'Constantes correctas', 'Constantes incorrectas')
  counter.check(liaDataTable('DataGrid', { isLoading: true })[LIA_DATA_ATTRIBUTES.STATE]?.includes('loading') === true, 'liaDataTable soporta loading', 'liaDataTable no soporta loading')
  counter.check(liaForm('PaymentForm', { isSubmitting: true })[LIA_DATA_ATTRIBUTES.STATE]?.includes('submitting') === true, 'liaForm soporta submitting', 'liaForm no soporta submitting')
  return counter.result()
}
