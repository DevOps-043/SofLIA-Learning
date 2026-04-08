'use client'

import { motion } from 'framer-motion'
import { BusinessReports } from '@/features/business-panel/components/BusinessReports'

export default function BusinessPanelReportsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >

      
      <BusinessReports />
    </motion.div>
  )
}
