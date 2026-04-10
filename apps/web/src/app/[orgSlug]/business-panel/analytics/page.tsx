'use client'

import { motion } from 'framer-motion'
import { BusinessAnalytics } from '@/features/business-panel/components/BusinessAnalytics'

export default function BusinessPanelAnalyticsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >

      
      <BusinessAnalytics />
    </motion.div>
  )
}
