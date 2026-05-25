import type { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { useBusinessSubscriptionPlansLogic } from '../../hooks/useBusinessSubscriptionPlansLogic'

export type BusinessPlansTheme = ReturnType<typeof useBusinessPanelTheme>
export type BusinessPlansLogic = ReturnType<typeof useBusinessSubscriptionPlansLogic>
export type BusinessPlansChangeInfo = NonNullable<BusinessPlansLogic['changeInfo']>
export type BusinessPlansFeatureGroup = BusinessPlansLogic['featuresByCategory'][string]
export type BillingCycleValue = BusinessPlansLogic['billingCycle']
export type SelectBillingCycle = BusinessPlansLogic['setBillingCycle']
