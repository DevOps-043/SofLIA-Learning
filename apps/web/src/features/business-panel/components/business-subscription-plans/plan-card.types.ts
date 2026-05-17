export interface BusinessSubscriptionPlanCard {
  id: string
  name: string
  tagline: string
  price: string
  priceYearly: number
  priceMonthly: number
  yearlyPrice: string
  monthlyPrice: string
  features: string[]
  isPopular?: boolean
  badge?: string
}

export interface PlanCardProps {
  plan: BusinessSubscriptionPlanCard
  index: number
  billingCycle: 'monthly' | 'yearly'
  currentPlan: string | null | undefined
  currentBillingCycle: string | null | undefined
  planLoading: boolean
  isChangingPlan: boolean
  getPlanColor: (planId: string) => string
  calculateYearlySavings: (plan: BusinessSubscriptionPlanCard) => number
  handleSelectPlan: (planId: string) => void
}
