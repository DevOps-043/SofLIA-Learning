'use client'

import { Building2, Crown, Sparkles, Users } from 'lucide-react'

export function PlanCardIcon({ planId }: { planId: string }) {
  switch (planId) {
    case 'team':
      return <Users className="h-6 w-6" />
    case 'business':
      return <Building2 className="h-6 w-6" />
    case 'enterprise':
      return <Crown className="h-6 w-6" />
    default:
      return <Sparkles className="h-6 w-6" />
  }
}
