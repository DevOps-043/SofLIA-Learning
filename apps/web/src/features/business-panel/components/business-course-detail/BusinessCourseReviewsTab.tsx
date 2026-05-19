import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import type { BusinessCourseDetail } from '../../types/business-course-detail.types'

interface BusinessCourseReviewsTabProps {
  course: BusinessCourseDetail
  textColor: string
  primaryColor: string
  borderColor: string
  onPrimaryColor: string
  mutedTextColor: string
  successColor: string
  formatDate: (dateString: string) => string
}

export function BusinessCourseReviewsTab({
  course,
  textColor,
  primaryColor,
  borderColor,
  onPrimaryColor,
  mutedTextColor,
  successColor,
  formatDate
}: BusinessCourseReviewsTabProps) {
  return (
    <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      {course.reviews.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-16 h-16 mx-auto mb-4" style={{ color: mutedTextColor }} />
          <p style={{ color: mutedTextColor }}>Aun no hay resenas para este curso</p>
        </div>
      ) : (
        <div className="space-y-4">
          {course.reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-5 rounded-xl border"
              style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 2%, transparent)`, borderColor }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ backgroundColor: primaryColor, color: onPrimaryColor }}>
                  {review.user.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold" style={{ color: textColor }}>{review.user.name}</h4>
                    {review.is_verified ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: `color-mix(in srgb, ${successColor} 12.5%, transparent)`, color: successColor }}>
                        Verificado
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {[...Array(5)].map((_, starIndex) => (
                      <Star
                        key={`${review.id}-${starIndex}`}
                        className={`w-4 h-4 ${starIndex < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                      />
                    ))}
                    <span className="text-xs" style={{ color: mutedTextColor }}>{formatDate(review.created_at)}</span>
                  </div>
                  {review.title ? <h5 className="font-medium mb-2" style={{ color: textColor }}>{review.title}</h5> : null}
                  <p className="text-sm leading-relaxed" style={{ color: textColor }}>{review.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
