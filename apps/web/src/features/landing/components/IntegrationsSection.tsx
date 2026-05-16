'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import {
  MessageSquare,
  Brain,
  Sparkles,
  Globe,
  Lightbulb,
  HelpCircle,
  CheckCircle2,
  Calendar,
  UserCog,
  MapPin,
  Send
} from 'lucide-react';
import { useMotionSafe } from '../../../lib/utils/motion';

interface IntegrationsSectionProps {
  className?: string;
}

const liaCapabilities = [
  {
    icon: MessageSquare,
    titleKey: 'conversation',
    descKey: 'conversationDesc',
  },
  {
    icon: Brain,
    titleKey: 'context',
    descKey: 'contextDesc',
  },
  {
    icon: Calendar,
    titleKey: 'studyPlanner',
    descKey: 'studyPlannerDesc',
  },
  {
    icon: UserCog,
    titleKey: 'rolePersonalization',
    descKey: 'rolePersonalizationDesc',
  },
  {
    icon: MapPin,
    titleKey: 'anywhere',
    descKey: 'anywhereDesc',
  },
  {
    icon: Globe,
    titleKey: 'multilingual',
    descKey: 'multilingualDesc',
  },
  {
    icon: Lightbulb,
    titleKey: 'recommendations',
    descKey: 'recommendationsDesc',
  },
  {
    icon: HelpCircle,
    titleKey: 'support',
    descKey: 'supportDesc',
  },
];

const liaActions = [
  'Responder dudas sobre cualquier contenido del curso',
  'Explicar conceptos complejos de manera simple',
  'Crear y gestionar tu plan de estudios proactivamente',
  'Detectar sesiones atrasadas y proponer reprogramaciones',
  'Personalizar recomendaciones según tu rol y nivel',
  'Ayudarte en cualquier sección de la plataforma',
  'Guiarte por la plataforma paso a paso',
  'Generar resúmenes de lecciones',
];

// Conversación simulada - LIA General
const chatConversation = [
  {
    type: 'user' as const,
    message: 'Hola SofLIA, ¿qué puedo hacer aquí?',
  },
  {
    type: 'lia' as const,
    message: 'Este es tu Dashboard. Desde aquí puedes ver tus cursos asignados, tu progreso de aprendizaje, certificaciones obtenidas y acceder a las comunidades. ¿En qué te puedo ayudar?',
  },
  {
    type: 'user' as const,
    message: '¿Cómo veo mis certificados?',
  },
  {
    type: 'lia' as const,
    message: 'Puedes ver tus certificados en la sección "Mis Certificados" del menú lateral. Ahí encontrarás todos los certificados que has obtenido al completar cursos. También puedes descargarlos o compartirlos.',
  },
];

// Componente de efecto máquina de escribir
function TypewriterText({ text, onComplete, speed = 30 }: { text: string; onComplete?: () => void; speed?: number }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span>
      {displayedText}
      {currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-0.5 h-4 bg-current ml-0.5 align-middle"
        />
      )}
    </span>
  );
}

// Static fallback: renders the entire conversation at once with no
// typewriter, no typing indicator, no per-message timers.  Used on
// Apple/WebKit and reduced-motion devices to avoid the per-frame
// CPU cost of the animated version (typewriter advances every 25-40
// ms via setTimeout, three infinite dot pulses, 25-second cycle).
function StaticChat() {
  return (
    <div className="space-y-4 min-h-[280px]">
      {chatConversation.map((msg, index) => {
        const isUser = msg.type === 'user';
        return (
          <div
            key={index}
            className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            {!isUser && (
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#00D4B3]/50 flex-shrink-0">
                <Image
                  src="/lia-avatar.webp"
                  alt="LIA"
                  fill
                  className="object-cover object-top"
                />
              </div>
            )}
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                isUser
                  ? 'bg-[#00D4B3] text-white rounded-br-md'
                  : 'bg-white/10 text-white/90 rounded-bl-md'
              }`}
            >
              {msg.message}
            </div>
            {isUser && (
              <div className="w-8 h-8 rounded-full bg-[#00D4B3]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-[#00D4B3]">TÚ</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Componente de chat animado
function AnimatedChat() {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    // Reiniciar el ciclo
    setVisibleMessages([]);
    setTypingMessageIndex(null);
    setShowTypingIndicator(false);

    const delays = [500, 3500, 7000, 10500]; // Tiempos para mostrar cada mensaje
    const typingDelays = [0, 2500, 5500, 9000]; // Tiempos para mostrar "escribiendo..."

    const timeouts: NodeJS.Timeout[] = [];

    chatConversation.forEach((msg, index) => {
      // Mostrar indicador de "escribiendo" antes de cada mensaje
      if (msg.type === 'lia') {
        const typingTimeout = setTimeout(() => {
          setShowTypingIndicator(true);
        }, typingDelays[index]);
        timeouts.push(typingTimeout);
      }

      // Mostrar el mensaje con animación de escritura
      const msgTimeout = setTimeout(() => {
        setShowTypingIndicator(false);
        setTypingMessageIndex(index);
        setVisibleMessages(prev => [...prev, index]);
      }, delays[index]);
      timeouts.push(msgTimeout);
    });

    // Reiniciar el ciclo después de que termine (10 segundos después del último mensaje)
    const resetTimeout = setTimeout(() => {
      setCycleKey(prev => prev + 1);
    }, 25000); // 15s de animación + 10s de pausa
    timeouts.push(resetTimeout);

    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [cycleKey]);

  return (
    <div className="space-y-4 min-h-[280px]">
      <AnimatePresence mode="sync">
        {chatConversation.map((msg, index) => {
          if (!visibleMessages.includes(index)) return null;

          const isUser = msg.type === 'user';
          const isTyping = typingMessageIndex === index;

          return (
            <motion.div
              key={`${cycleKey}-${index}`}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#00D4B3]/50 flex-shrink-0">
                  <Image
                    src="/lia-avatar.webp"
                    alt="LIA"
                    fill
                    className="object-cover object-top"
                  />
                </div>
              )}
              
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                  isUser
                    ? 'bg-[#00D4B3] text-white rounded-br-md'
                    : 'bg-white/10 text-white/90 rounded-bl-md'
                }`}
              >
                {isTyping ? (
                  <TypewriterText 
                    text={msg.message} 
                    speed={isUser ? 40 : 25}
                    onComplete={() => setTypingMessageIndex(null)}
                  />
                ) : (
                  msg.message
                )}
              </div>
              
              {isUser && (
                <div className="w-8 h-8 rounded-full bg-[#00D4B3]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#00D4B3]">TÚ</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Indicador de "LIA está escribiendo..." */}
      <AnimatePresence>
        {showTypingIndicator && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-3 items-center"
          >
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#00D4B3]/50 flex-shrink-0">
              <Image
                src="/lia-avatar.webp"
                alt="SofLIA"
                fill
                className="object-cover object-top"
              />
            </div>
            <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 bg-white/60 rounded-full"
                />
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-white/60 rounded-full"
                />
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 bg-white/60 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function IntegrationsSection({ className = '' }: IntegrationsSectionProps) {
  const { t } = useTranslation('common');
  const { disableHeavy } = useMotionSafe();

  return (
    <section 
      id="integrations" 
      className={`py-20 lg:py-28 bg-gradient-to-b from-[#E9ECEF]/30 to-white dark:from-[#0A2540]/30 dark:to-[#0F1419] ${className}`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 rounded-full mb-6">
            <Sparkles size={16} className="text-[#00D4B3]" />
            <span className="text-sm font-medium text-[#00D4B3]">
              {t('landing.liaSection.tag', 'Asistente de IA')}
            </span>
          </div>
          
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-[#0A2540] dark:text-white mb-6">
            {t('landing.liaSection.title', '¿Qué puede hacer')} <span className="text-[#00D4B3]">SofLIA</span> {t('landing.liaSection.titleEnd', 'por ti?')}
          </h2>
          
          <p className="text-lg text-[#6C757D] dark:text-white/70 max-w-3xl mx-auto">
            {t('landing.liaSection.description', 'SofLIA es tu asistente de aprendizaje con inteligencia artificial, disponible 24/7 para ayudarte en cada paso de tu capacitación.')}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Capabilities Grid */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-xl font-bold text-[#0A2540] dark:text-white mb-6">
              {t('landing.liaSection.capabilitiesTitle', 'Capacidades de SofLIA')}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {liaCapabilities.map((capability, index) => (
                <motion.div
                  key={capability.titleKey}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="p-5 bg-white dark:bg-white/5 rounded-xl border border-[#E9ECEF] dark:border-white/10 hover:border-[#00D4B3]/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00D4B3]/20 to-[#00A896]/20 flex items-center justify-center mb-4">
                    <capability.icon size={22} className="text-[#00D4B3]" />
                  </div>
                  <h4 className="font-semibold text-[#0A2540] dark:text-white mb-2">
                    {t(`landing.liaSection.capabilities.${capability.titleKey}`, capability.titleKey)}
                  </h4>
                  <p className="text-sm text-[#6C757D] dark:text-white/60">
                    {t(`landing.liaSection.capabilities.${capability.descKey}`, capability.descKey)}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* What LIA Can Do */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-xl font-bold text-[#0A2540] dark:text-white mb-6">
              {t('landing.liaSection.actionsTitle', 'SofLIA puede ayudarte a:')}
            </h3>
            
            {/* Actions List */}
            <div className="space-y-3 mb-8">
              {liaActions.map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 size={20} className="text-[#00D4B3] flex-shrink-0 mt-0.5" />
                  <span className="text-[#0A2540] dark:text-white/90">
                    {t(`landing.liaSection.actions.${index}`, action)}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* LIA Interactive Chat Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="relative p-6 bg-gradient-to-br from-[#0A2540] to-[#1a3a5c] rounded-2xl overflow-hidden"
            >
              {/* Decorative orbs — skipped on heat-sensitive devices (also
                  covered by the global CSS hide rule for .absolute.blur-3xl). */}
              {!disableHeavy && (
                <>
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#00D4B3]/20 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#8B5CF6]/10 rounded-full blur-2xl" />
                </>
              )}
              
              {/* Chat Header */}
              <div className="relative flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#00D4B3]/50">
                  <Image
                    src="/lia-avatar.webp"
                    alt="LIA"
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">SofLIA</span>
                    <span className="px-2 py-0.5 bg-[#00D4B3]/20 text-[#00D4B3] text-xs font-medium rounded-full">
                      {t('landing.liaSection.preview.online', 'En línea')}
                    </span>
                  </div>
                  <p className="text-white/50 text-xs">Tu asistente de aprendizaje</p>
                </div>
              </div>
              
              {/* Chat preview.  Animated version on capable devices, static
                  fallback on Apple/WebKit and reduced-motion: the animated
                  flow runs setTimeout-based typewriters every 25-40 ms plus
                  three infinite framer pulses, which dominated the heat
                  reports from iPhone/iPad users on the landing. */}
              <div className="relative">
                {disableHeavy ? <StaticChat /> : <AnimatedChat />}
              </div>
              
              {/* Fake Input */}
              <div className="relative mt-4 flex items-center gap-2 p-3 bg-white/10 rounded-xl border border-white/20">
                <span className="text-white/50 text-sm flex-1">
                  {t('landing.liaSection.preview.placeholder', 'Escribe tu pregunta...')}
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#00D4B3] flex items-center justify-center">
                  <Send size={16} className="text-white" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

