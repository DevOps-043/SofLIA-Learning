import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

import type { BusinessCourseDetail } from '../../types/business-course-detail.types'
import styles from './BusinessCourseDetail.module.css'

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
  formatDate,
}: BusinessCourseReviewsTabProps) {
  return (
    <motion.div
      key="reviews"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
    >
      {course.reviews.length === 0 ? (
        <div className={styles.emptyState}>
          <div>
            <span className={styles.emptyStateIcon} aria-hidden="true">
              <Star />
            </span>
            <h4>Aún no hay reseñas</h4>
            <p>Las opiniones verificadas de quienes tomen este curso aparecerán en esta sección.</p>
          </div>
        </div>
      ) : (
        <div className={styles.reviewList}>
          {course.reviews.map((review, index) => (
            <motion.article
              key={review.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={styles.review}
            >
              <span className={styles.reviewAvatar} aria-hidden="true">
                {review.user.name[0]?.toUpperCase()}
              </span>
              <div className={styles.reviewBody}>
                <header className={styles.reviewHeader}>
                  <h4>{review.user.name}</h4>
                  {review.is_verified ? <span>Verificada</span> : null}
                </header>
                <div className={styles.reviewMeta} aria-label={`Valoración ${review.rating} de 5`}>
                  {Array.from({ length: 5 }, (_, starIndex) => (
                    <Star
                      key={`${review.id}-${starIndex}`}
                      fill={starIndex < review.rating ? 'currentColor' : 'none'}
                      style={{ opacity: starIndex < review.rating ? 1 : 0.35 }}
                      aria-hidden="true"
                    />
                  ))}
                  <time dateTime={review.created_at}>{formatDate(review.created_at)}</time>
                </div>
                {review.title ? <h5>{review.title}</h5> : null}
                <p>{review.content}</p>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </motion.div>
  )
}
