import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Loader2, Shield, TrendingUp, Users, Video, Award, Zap, Star } from 'lucide-react'
import type { BusinessCourseDetail } from '../../types/business-course-detail.types'

interface BusinessCourseDetailSidebarProps {
  course: BusinessCourseDetail
  setIsAssignModalOpen: (value: boolean) => void
  isPurchasing: boolean
  purchaseSuccess: boolean
  purchaseError: string | null
  primaryColor: string
  accentColor: string
  cardBackground: string
  borderColor: string
  textColor: string
  isDark: boolean
  onPurchase: () => void
  formatDate: (dateString: string) => string
}

export function BusinessCourseDetailSidebar({
  course,
  setIsAssignModalOpen,
  isPurchasing,
  purchaseSuccess,
  purchaseError,
  primaryColor,
  accentColor,
  cardBackground,
  borderColor,
  textColor,
  isDark,
  onPurchase,
  formatDate
}: BusinessCourseDetailSidebarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl p-4 sm:p-6 border sticky top-6 shadow-sm"
      style={{ backgroundColor: cardBackground, borderColor }}
    >
      <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b" style={{ borderColor }}>
        {course.subscription_status?.is_organization_purchased ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${accentColor}20` }}>
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: accentColor }} />
            </div>
            <div className="min-w-0">
              <span className="text-xl sm:text-2xl font-bold block truncate" style={{ color: accentColor }}>Adquirido</span>
              <p className="text-xs sm:text-sm truncate" style={{ color: `${textColor}60` }}>Listo para asignar</p>
            </div>
          </div>
        ) : course.subscription_status?.can_purchase_for_free ? (
          <div>
            <span className="text-3xl font-bold" style={{ color: primaryColor }}>Gratis</span>
            <p className="text-sm mt-1" style={{ color: `${textColor}60` }}>Incluido en tu membresia</p>
          </div>
        ) : (
          <div>
            <span className="text-3xl font-bold" style={{ color: textColor }}>
              ${course.price?.toFixed(2) || '0.00'}
            </span>
            <span className="text-sm ml-2" style={{ color: `${textColor}60` }}>USD</span>
          </div>
        )}
      </div>

      {purchaseSuccess ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-xl border flex items-center gap-3"
          style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30` }}
        >
          <CheckCircle2 className="w-5 h-5" style={{ color: accentColor }} />
          <span className="text-sm font-medium" style={{ color: accentColor }}>Curso adquirido exitosamente</span>
        </motion.div>
      ) : null}

      {purchaseError ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-xl border flex items-center gap-3"
          style={{ backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' }}
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-sm font-medium text-red-400">{purchaseError}</span>
        </motion.div>
      ) : null}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={course.subscription_status?.is_organization_purchased ? () => setIsAssignModalOpen(true) : onPurchase}
        disabled={isPurchasing || course.subscription_status?.has_subscription === false}
        className="w-full py-4 rounded-xl font-semibold !text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        style={{
          backgroundColor: primaryColor,
          color: '#FFFFFF',
          boxShadow: `0 8px 30px ${primaryColor}40`
        }}
      >
        {isPurchasing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin !text-white" color="#FFFFFF" />
            <span className="!text-white" style={{ color: '#FFFFFF' }}>Procesando...</span>
          </>
        ) : course.subscription_status?.is_organization_purchased ? (
          <>
            <Users className="w-5 h-5 !text-white" color="#FFFFFF" />
            <span className="!text-white" style={{ color: '#FFFFFF' }}>Asignar a Usuarios</span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5 !text-white" color="#FFFFFF" />
            <span className="!text-white" style={{ color: '#FFFFFF' }}>Adquirir Curso</span>
          </>
        )}
      </motion.button>

      {course.subscription_status?.has_subscription === false ? (
        <p className="text-center text-sm mt-3" style={{ color: `${textColor}50` }}>
          Requiere una membresia activa
        </p>
      ) : null}

      <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
        {[
          { icon: Shield, text: 'Acceso de por vida' },
          { icon: Video, text: `${course.stats.total_lessons} lecciones en video` },
          { icon: Award, text: 'Certificado de finalizacion' },
          { icon: TrendingUp, text: `Actualizado ${formatDate(course.updated_at)}` }
        ].map(feature => (
          <div key={feature.text} className="flex items-center gap-3">
            <feature.icon className="w-5 h-5" style={{ color: accentColor }} />
            <span className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.85)' : `${textColor}80` }}>{feature.text}</span>
          </div>
        ))}
      </div>

      {course.rating > 0 ? (
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 mb-1">
                <Star className="w-6 h-6 text-yellow-400" fill="#FACC15" />
                <span className="text-2xl font-bold" style={{ color: textColor }}>{course.rating.toFixed(1)}</span>
              </div>
              <p className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.75)' : `${textColor}50` }}>{course.review_count} resenas</p>
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
