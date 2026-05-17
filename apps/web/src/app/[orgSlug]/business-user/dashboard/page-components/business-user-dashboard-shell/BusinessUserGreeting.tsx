import { useMinuteTicker } from '@/shared/hooks/useMinuteTicker'

import { getBusinessUserDashboardGreeting } from '../../services/business-user-dashboard.service'
import type { DashboardTranslator } from './types'

interface BusinessUserGreetingProps {
  firstName?: string
  t: DashboardTranslator
}

export function BusinessUserGreeting({ firstName, t }: BusinessUserGreetingProps) {
  const currentTime = useMinuteTicker()

  return (
    <>
      {getBusinessUserDashboardGreeting(currentTime, t)},{' '}
      <span className="text-white">
        {firstName || t('dashboard.userFallback', 'Usuario')}
      </span>
    </>
  )
}
