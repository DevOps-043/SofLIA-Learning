'use client'

import { motion } from 'framer-motion'
import type { AdminWorkshop } from '../../services/adminWorkshops.service'
import { AdminWorkshopCard } from './AdminWorkshopCard'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

interface AdminWorkshopsGridProps {
  workshops: AdminWorkshop[]
  onView: (workshop: AdminWorkshop) => void
  onEdit: (workshop: AdminWorkshop) => void
  onDelete: (workshop: AdminWorkshop) => void
}

export function AdminWorkshopsGrid({
  workshops,
  onView,
  onEdit,
  onDelete,
}: AdminWorkshopsGridProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {workshops.map((workshop, index) => (
        <AdminWorkshopCard
          key={workshop.id}
          workshop={workshop}
          index={index}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </motion.div>
  )
}
