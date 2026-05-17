import { motion } from 'framer-motion'
import { Building2, GraduationCap, Users } from 'lucide-react'
import { staggerContainer, staggerItem } from '@/shared/utils/animations'

export function BusinessStatsSection() {
  const stats = [
    { value: '500+', label: 'Empresas', icon: Building2 },
    { value: '50K+', label: 'Usuarios', icon: Users },
    { value: '100+', label: 'Instructores', icon: GraduationCap },
  ]

  return (
    <section className="py-16 bg-white dark:bg-[#0F1419]">
      <div className="container mx-auto px-4">
        <motion.div className="grid grid-cols-3 gap-8 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
          {stats.map((stat) => {
            const IconComponent = stat.icon
            return (
              <motion.div key={stat.label} variants={staggerItem} className="relative">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#00D4B3' }}>
                    <IconComponent className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="text-4xl font-bold text-[#0A2540] dark:text-white mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>{stat.value}</div>
                <div className="text-lg text-[#6C757D] dark:text-white/70" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{stat.label}</div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
