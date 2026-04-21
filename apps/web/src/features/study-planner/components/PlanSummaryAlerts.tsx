'use client'

import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface PlanSummaryAlertsProps {
  errors: string[]
  warnings: string[]
}

function AlertBlock({
  items,
  title,
  tone,
}: {
  items: string[]
  title: string
  tone: 'red' | 'yellow'
}) {
  if (!items.length) {
    return null
  }

  const classes =
    tone === 'red'
      ? {
          box: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50',
          icon: 'text-red-500',
          title: 'text-red-800 dark:text-red-200',
          item: 'text-red-700 dark:text-red-300',
        }
      : {
          box: 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50',
          icon: 'text-yellow-500',
          title: 'text-yellow-800 dark:text-yellow-200',
          item: 'text-yellow-700 dark:text-yellow-300',
        }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${classes.box} rounded-xl p-4`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 ${classes.icon} flex-shrink-0 mt-0.5`} />
        <div>
          <h4 className={`font-medium ${classes.title} mb-1`}>{title}</h4>
          <ul className={`text-sm ${classes.item} space-y-1`}>
            {items.map((item, index) => (
              <li key={index}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}

export function PlanSummaryAlerts({
  errors,
  warnings,
}: PlanSummaryAlertsProps) {
  return (
    <>
      <AlertBlock items={errors} title="Problemas a resolver" tone="red" />
      <AlertBlock items={warnings} title="Recomendaciones" tone="yellow" />
    </>
  )
}
