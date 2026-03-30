'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@aprende-y-aplica/ui';
import { ContentService } from '../../core/services/contentService';
import { BusinessPageContent } from '@aprende-y-aplica/shared';
import { HeroBusinessSection } from '../../features/landing/components/business/HeroBusinessSection';
import { FeaturesSection } from '../../features/landing/components/FeaturesSection';
import { InstructorsSection } from '../../features/landing/components/business/InstructorsSection';
import { TestimonialsSection } from '../../features/landing/components/TestimonialsSection';
import { CTASection } from '../../features/landing/components/CTASection';
import { fadeIn, slideUp, staggerContainer, staggerItem } from '../../shared/utils/animations';
import { ArrowRight, Building2, Users, GraduationCap, Award, Bot, User } from 'lucide-react';

export default function BusinessHomePage() {
  const [content, setContent] = useState<BusinessPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [particles, setParticles] = useState<Array<{ left: number; top: number; xOffset: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    async function loadContent() {
      try {
        setLoading(true);
        const result = await ContentService.getBusinessPageContent();
        
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setContent(result.data);
        }
      } catch (err) {
        setError('Error al cargar el contenido');
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, []);

  // Generar partículas solo en el cliente para evitar errores de hidratación
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setParticles(
        Array.from({ length: 6 }, () => ({
          left: Math.random() * 100,
          top: Math.random() * 100,
          xOffset: Math.random() * 20 - 10,
          delay: Math.random() * 2,
          duration: 3 + Math.random() * 2,
        }))
      );
    }
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-carbon flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full blur-3xl opacity-10"
            style={{
              background: 'radial-gradient(circle, var(--color-primary, rgb(59, 130, 246)), transparent)',
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute -bottom-1/2 -right-1/4 w-[800px] h-[800px] rounded-full blur-3xl opacity-10"
            style={{
              background: 'radial-gradient(circle, var(--color-secondary, rgb(139, 92, 246)), transparent)',
            }}
            animate={{
              x: [0, -100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />

          {/* Subtle Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(var(--color-primary, rgba(59, 130, 246, 0.1)) 1px, transparent 1px),
                linear-gradient(90deg, var(--color-primary, rgba(59, 130, 246, 0.1)) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        {/* Loading Content */}
        <motion.div
          className="relative z-10 flex flex-col items-center gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Premium Spinner */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40">
            {/* Outer Ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-[3px] border-transparent"
              style={{
                borderTopColor: 'var(--color-primary, rgb(59, 130, 246))',
                borderRightColor: 'var(--color-secondary, rgb(139, 92, 246))',
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* Middle Ring */}
            <motion.div
              className="absolute inset-2 sm:inset-3 rounded-full border-[3px] border-transparent"
              style={{
                borderBottomColor: 'var(--color-primary, rgb(59, 130, 246))',
                borderLeftColor: 'var(--color-secondary, rgb(139, 92, 246))',
              }}
              animate={{ rotate: -360 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* Inner Pulsing Circle */}
            <motion.div
              className="absolute inset-4 sm:inset-6 rounded-full"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary, rgb(59, 130, 246)), var(--color-secondary, rgb(139, 92, 246)))',
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Center Dot */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white shadow-lg"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
              />
            </motion.div>

            {/* Shimmer Effect */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)',
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </div>

          {/* Loading Text */}
          <div className="flex flex-col items-center gap-4">
            <motion.p
              className="text-white/90 text-lg sm:text-xl font-medium tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Cargando...
            </motion.p>
            
            {/* Animated Dots */}
            <motion.div
              className="flex gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="w-2.5 h-2.5 rounded-full shadow-lg"
                  style={{
                    backgroundColor: 'var(--color-primary, rgb(59, 130, 246))',
                  }}
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: index * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Progress Indicator */}
          <motion.div
            className="w-64 sm:w-80 h-1.5 rounded-full overflow-hidden backdrop-blur-sm"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
            }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <motion.div
              className="h-full rounded-full relative"
              style={{
                background: 'linear-gradient(90deg, var(--color-primary, rgb(59, 130, 246)), var(--color-secondary, rgb(139, 92, 246)))',
              }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <motion.div
                className="h-full w-1/3 rounded-full absolute top-0"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent)',
                }}
                animate={{
                  x: ['-100%', '400%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Floating Particles */}
        {particles.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              backgroundColor: 'var(--color-primary, rgb(59, 130, 246))',
              opacity: 0.3,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, particle.xOffset, 0],
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: particle.delay,
            }}
          />
        ))}
      </main>
    );
  }

  if (error || !content) {
    return (
      <main className="min-h-screen bg-carbon flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-white/70 mb-8">{error || 'No se pudo cargar el contenido'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#0F1419]">
      {/* Hero Section */}
      <HeroBusinessSection content={content.hero} />
      
      {/* Statistics Section */}
      <section className="py-16 bg-white dark:bg-[#0F1419]">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid grid-cols-3 gap-8 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { value: '500+', label: 'Empresas', icon: Building2 },
              { value: '50K+', label: 'Usuarios', icon: Users },
              { value: '100+', label: 'Instructores', icon: GraduationCap },
            ].map((stat, idx) => {
              const IconComponent = stat.icon;
              return (
                <motion.div
                  key={idx}
                  variants={staggerItem}
                  className="relative"
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#00D4B3' }}>
                      <IconComponent className="w-8 h-8 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-[#0A2540] dark:text-white mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
                    {stat.value}
                  </div>
                  <div className="text-lg text-[#6C757D] dark:text-white/70" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Use Cases Carousel Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Sea cual sea tu objetivo, el camino empieza aquí
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              {
                id: 'enterprise-training',
                icon: Building2,
                title: 'Capacitación a nivel de empresa',
                description: 'Mejora las habilidades de toda tu organización',
                link: '/business/what-we-do',
              },
              {
                id: 'certifications',
                icon: Award,
                title: 'Preparación para certificaciones',
                description: 'Desarrolla y valida habilidades',
                link: '/business/what-we-do',
              },
              {
                id: 'ai-skills',
                icon: Bot,
                title: 'Obtención de nuevas habilidades con IA',
                description: 'Aumenta la productividad con IA generativa',
                link: '/business/how-it-works',
              },
              {
                id: 'leadership',
                icon: User,
                title: 'Desarrollo de liderazgo',
                description: 'Identifica y empodera a los líderes',
                link: '/business/resources',
              },
            ].map((useCase, idx) => {
              const IconComponent = useCase.icon;
              return (
                <motion.div
                  key={useCase.id}
                  variants={staggerItem}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="cursor-pointer"
                >
                  <Link href={useCase.link}>
                    <div className="bg-glass border border-glass-light rounded-2xl p-8 h-full hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
                      <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#00D4B3' }}>
                          <IconComponent className="w-8 h-8 text-white" strokeWidth={2.5} />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-[#0A2540] dark:text-white" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
                        {useCase.title}
                      </h3>
                      <p className="text-[#6C757D] dark:text-white/70 text-sm mb-4" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                        {useCase.description}
                      </p>
                      <div className="flex items-center text-[#00D4B3] text-sm font-medium group-hover:gap-2 transition-all" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                        Ver más
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Common Benefits Section */}
      <FeaturesSection 
        title={content.benefits.title}
        subtitle={content.benefits.subtitle}
        cards={content.benefits.cards}
      />
      
      {/* Featured Instructors */}
      <InstructorsSection
        title={content.instructors.title}
        subtitle={content.instructors.subtitle}
        instructors={content.instructors.items}
      />
      
      {/* CTA Section */}
      <CTASection 
        title={content.cta.title}
        subtitle={content.cta.subtitle}
        buttonText={content.cta.buttonText}
      />
    </main>
  );
}
