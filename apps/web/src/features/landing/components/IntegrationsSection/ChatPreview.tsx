import Image from 'next/image'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import { AnimatedChat } from './AnimatedChat'
import { StaticChat } from './StaticChat'

type Translate = (key: string, defaultValue?: string) => string

interface ChatPreviewProps {
  disableHeavy: boolean
  t: Translate
  chatMessages?: Array<{ type: 'user' | 'lia'; message: string }>
}

export function ChatPreview({ disableHeavy, t, chatMessages }: ChatPreviewProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="relative p-6 bg-gradient-to-br from-primary to-[var(--color-legacy-1a3a5c)] rounded-2xl overflow-hidden">
      {!disableHeavy && (
        <>
          <div className="absolute top-0 right-0 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
        </>
      )}
      <div className="relative flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-accent/50">
          <Image src="/lia-avatar.webp" alt="LIA" fill className="object-cover object-top" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">SofLIA</span>
            <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs font-medium rounded-full">
              {t('landing.liaSection.preview.online', 'En línea')}
            </span>
          </div>
          <p className="text-white/50 text-xs">{t('landing.badges.learningAssistant', 'Tu asistente de aprendizaje')}</p>
        </div>
      </div>
      <div className="relative">
        {disableHeavy ? (
          <StaticChat messages={chatMessages || []} />
        ) : (
          <AnimatedChat messages={chatMessages || []} />
        )}
      </div>
      <div className="relative mt-4 flex items-center gap-2 p-3 bg-white/10 rounded-xl border border-white/20">
        <span className="text-white/50 text-sm flex-1">
          {t('landing.liaSection.preview.placeholder', 'Escribe tu pregunta...')}
        </span>
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <Send size={16} className="text-white" />
        </div>
      </div>
    </motion.div>
  )
}
