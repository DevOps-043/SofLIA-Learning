import { notFound } from 'next/navigation'

import { ResponsiveSmokeScenarioPage } from '@/features/responsive-smoke/ResponsiveSmokeScenarioPage'
import {
  responsiveSmokeScenarioIds,
  type ResponsiveSmokeScenarioId,
} from '@/features/responsive-smoke/constants'

function isResponsiveSmokeScenarioId(
  value: string,
): value is ResponsiveSmokeScenarioId {
  return (responsiveSmokeScenarioIds as readonly string[]).includes(value)
}

export default function ResponsiveSmokeScenarioRoute({
  params,
}: {
  params: { scenario: string }
}) {
  if (!isResponsiveSmokeScenarioId(params.scenario)) {
    notFound()
  }

  return <ResponsiveSmokeScenarioPage scenario={params.scenario} />
}
