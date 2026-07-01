import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Loader2, Shield, TrendingUp, Users, Video, Award, Zap, Star, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BusinessCourseDetail } from '../../types/business-course-detail.types'

interface BusinessCourseDetailSidebarProps {
  course: BusinessCourseDetail
  setIsAssignModalOpen: (value: boolean) => void
  onOpenDefaultModal: () => void
  isPurchasing: boolean
  purchaseSuccess: boolean
  purchaseError: string | null
  primaryColor: string
  accentColor: string
  cardBackground: string
  borderColor: string
  dividerColor: string
  textColor: string
  mutedTextColor: string
  onPrimaryColor: string
  successColor: string
  dangerColor: string
  onPurchase: () => void
  formatDate: (dateString: string) => string
}

export function BusinessCourseDetailSidebar({
  course,
  setIsAssignModalOpen,
  onOpenDefaultModal,
  isPurchasing,
  purchaseSuccess,
  purchaseError,
  primaryColor,
  accentColor,
  cardBackground,
  borderColor,
  dividerColor,
  textColor,
  mutedTextColor,
  onPrimaryColor,
  successColor,
  dangerColor,
  onPurchase,
  formatDate
}: BusinessCourseDetailSidebarProps) {
  const { t } = useTranslation('business')
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 xl:p-10 border sticky top-8 shadow-2xl overflow-hidden"
      style={{
        backgroundColor: cardBackground,
        borderColor,
        backdropFilter: 'blur(20px)'
      }}
    >
      <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b" style={{ borderColor: dividerColor }}>
        {course.subscription_status?.is_organization_purchased ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 12.5%, transparent)` }}>
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: accentColor }} />
            </div>
            <div className="min-w-0">
              <span className="text-xl lg:text-2xl font-bold block truncate" style={{ color: accentColor }}>Adquirido</span>
              <p className="text-[10px] lg:text-sm truncate" style={{ color: mutedTextColor }}>Listo para asignar</p>
            </div>
          </div>
        ) : course.subscription_status?.can_purchase_for_free ? (
          <div>
            <span className="text-2xl lg:text-3xl font-bold" style={{ color: primaryColor }}>Gratis</span>
            <p className="text-[10px] lg:text-sm mt-1" style={{ color: mutedTextColor }}>Incluido en tu membresia</p>
          </div>
        ) : (
          <div>
            <span className="text-2xl lg:text-3xl font-bold" style={{ color: textColor }}>
              ${course.price?.toFixed(2) || '0.00'}
            </span>
            <span className="text-xs lg:text-sm ml-2" style={{ color: mutedTextColor }}>USD</span>
          </div>
        )}
      </div>

      {purchaseSuccess ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-xl border flex items-center gap-3"
          style={{ backgroundColor: `color-mix(in srgb, ${successColor} 8.2%, transparent)`, borderColor: `color-mix(in srgb, ${successColor} 18.8%, transparent)` }}
        >
          <CheckCircle2 className="w-5 h-5" style={{ color: successColor }} />
          <span className="text-xs font-medium" style={{ color: successColor }}>Curso adquirido exitosamente</span>
        </motion.div>
      ) : null}

      {purchaseError ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-xl border flex items-center gap-3"
          style={{ backgroundColor: `color-mix(in srgb, ${dangerColor} 8.2%, transparent)`, borderColor: `color-mix(in srgb, ${dangerColor} 18.8%, transparent)` }}
        >
          <AlertCircle className="w-5 h-5" style={{ color: dangerColor }} />
          <span className="text-xs font-medium" style={{ color: dangerColor }}>{purchaseError}</span>
        </motion.div>
      ) : null}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={course.subscription_status?.is_organization_purchased ? () => setIsAssignModalOpen(true) : onPurchase}
        disabled={isPurchasing || course.subscription_status?.has_subscription === false}
        className="w-full py-4 lg:py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-[10px] lg:text-xs"
        style={{
          backgroundColor: accentColor,
          color: onPrimaryColor,
          boxShadow: `0 8px 30px color-mix(in srgb, ${accentColor} 25.1%, transparent)`
        }}
      >
        {isPurchasing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin shrink-0" style={{ color: onPrimaryColor }} />
            <span style={{ color: onPrimaryColor }}>Procesando...</span>
          </>
        ) : course.subscription_status?.is_organization_purchased ? (
          <>
            <Users className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" style={{ color: onPrimaryColor }} />
            <span style={{ color: onPrimaryColor }}>Asignar a Usuarios</span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" style={{ color: onPrimaryColor }} />
            <span style={{ color: onPrimaryColor }}>Adquirir Curso</span>
          </>
        )}
      </motion.button>

      {course.subscription_status?.is_organization_purchased ? (
        <button
          type="button"
          onClick={onOpenDefaultModal}
          className="w-full mt-3 py-3 lg:py-3.5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border text-[10px] lg:text-xs"
          style={{ backgroundColor: cardBackground, borderColor, color: textColor }}
        >
          <Sparkles className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
          <span>{t('assignCourse.defaults.title')}</span>
        </button>
      ) : null}

      {course.subscription_status?.has_subscription === false ? (
        <p className="text-center text-[10px] mt-3" style={{ color: mutedTextColor }}>
          Requiere una membresia activa
        </p>
      ) : null}

      <div className="mt-6 pt-6 border-t space-y-4" style={{ borderColor: dividerColor }}>
        {[
          { icon: Shield, text: 'Acceso de por vida' },
          { icon: Video, text: `${course.stats.total_lessons} lecciones en video` },
          { icon: Award, text: 'Certificado de finalizacion' },
          { icon: TrendingUp, text: `Actualizado ${formatDate(course.updated_at)}` }
        ].map(feature => (
          <div key={feature.text} className="flex items-center gap-3">
            <feature.icon className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: accentColor }} />
            <span className="text-xs" style={{ color: textColor }}>{feature.text}</span>
          </div>
        ))}
      </div>

      {course.rating > 0 ? (
        <div className="mt-6 pt-6 border-t" style={{ borderColor: dividerColor }}>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 mb-1">
                <Star className="w-6 h-6 text-yellow-400" fill="var(--color-legacy-facc15)" />
                <span className="text-2xl font-bold" style={{ color: textColor }}>{course.rating.toFixed(1)}</span>
              </div>
              <p className="text-xs" style={{ color: mutedTextColor }}>{course.review_count} resenas</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, index) => (
                  <Star key={`sidebar-star-${index}`} className={`w-4 h-4 ${index < Math.floor(course.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  )
}
