import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Award, Bot, Building2, User } from 'lucide-react'
import { fadeIn, staggerItem } from '@/shared/utils/animations'

export function BusinessUseCasesSection() {
  const useCases = [
    { id: 'enterprise-training', icon: Building2, title: 'Capacitación a nivel de empresa', description: 'Mejora las habilidades de toda tu organización', link: '/business/what-we-do' },
    { id: 'certifications', icon: Award, title: 'Preparación para certificaciones', description: 'Desarrolla y valida habilidades', link: '/business/what-we-do' },
    { id: 'ai-skills', icon: Bot, title: 'Obtención de nuevas habilidades con IA', description: 'Aumenta la productividad con IA generativa', link: '/business/how-it-works' },
    { id: 'leadership', icon: User, title: 'Desarrollo de liderazgo', description: 'Identifica y empodera a los líderes', link: '/business/resources' },
  ]

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">Sea cual sea tu objetivo, el camino empieza aquí</h2>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {useCases.map((useCase) => {
            const IconComponent = useCase.icon
            return (
              <motion.div key={useCase.id} variants={staggerItem} initial="hidden" whileInView="visible" viewport={{ once: true }} whileHover={{ y: -8, scale: 1.02 }} className="cursor-pointer">
                <Link href={useCase.link}>
                  <div className="bg-glass border border-glass-light rounded-2xl p-8 h-full hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
                    <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent)' }}>
                        <IconComponent className="w-8 h-8 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-primary dark:text-white" style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 700 }}>{useCase.title}</h3>
                    <p className="text-gray-500 dark:text-white/70 text-sm mb-4" style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 400 }}>{useCase.description}</p>
                    <div className="flex items-center text-accent text-sm font-medium group-hover:gap-2 transition-all" style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 500 }}>
                      Ver más <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
