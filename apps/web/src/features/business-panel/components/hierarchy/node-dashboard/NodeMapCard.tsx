'use client'

import { Map as MapIcon } from 'lucide-react'
import { HierarchyMapWrapper } from '../HierarchyMapWrapper'
import type { NodeDashboardCommonProps } from './node-dashboard.types'
import styles from '../HierarchyExperience.module.css'

export function NodeMapCard({ state, t }: NodeDashboardCommonProps) {
  const data = state.data
  if (!data) return null
  const points = [data.node, ...data.children].flatMap((node) => {
    const lat = Number(node.properties.latitude)
    const lng = Number(node.properties.longitude)
    return Number.isFinite(lat) && Number.isFinite(lng)
      ? [{ id: node.id, name: node.name, lat, lng }]
      : []
  })
  return (
    <section className={`${styles.dashboardCard} ${styles.mapCard}`}>
      <div className={styles.mapHeader}>
        <MapIcon aria-hidden="true" />
        <span>{t('hierarchy.map.title')}</span>
      </div>
      <HierarchyMapWrapper points={points} />
    </section>
  )
}
