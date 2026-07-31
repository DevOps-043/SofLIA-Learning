import { motion } from 'framer-motion'
import { GraduationCap, Mail } from 'lucide-react'

import type { BusinessCourseDetail } from '../../types/business-course-detail.types'
import styles from './BusinessCourseDetail.module.css'

interface BusinessCourseInstructorTabProps {
  course: BusinessCourseDetail
  textColor: string
  primaryColor: string
  accentColor: string
  onPrimaryColor: string
  mutedTextColor: string
}

export function BusinessCourseInstructorTab({
  course,
}: BusinessCourseInstructorTabProps) {
  return (
    <motion.div
      key="instructor"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
    >
      {course.instructor ? (
        <article className={styles.instructor}>
          <div className={styles.instructorAvatar}>
            {course.instructor.profile_picture_url ? (
              <img
                src={course.instructor.profile_picture_url}
                alt={course.instructor.name}
              />
            ) : (
              course.instructor.name[0]?.toUpperCase()
            )}
          </div>
          <div className={styles.instructorCopy}>
            <h3>{course.instructor.name}</h3>
            {course.instructor.email ? (
              <a href={`mailto:${course.instructor.email}`} className={styles.instructorEmail}>
                <Mail aria-hidden="true" />
                <span>{course.instructor.email}</span>
              </a>
            ) : null}
          </div>
          {course.instructor.bio ? (
            <section className={styles.instructorBio}>
              <h4>Biografía</h4>
              <p className="whitespace-pre-line">{course.instructor.bio}</p>
            </section>
          ) : null}
        </article>
      ) : (
        <div className={styles.emptyState}>
          <div>
            <span className={styles.emptyStateIcon} aria-hidden="true">
              <GraduationCap />
            </span>
            <h4>Instructor por confirmar</h4>
            <p>La información del instructor todavía no está disponible para este curso.</p>
          </div>
        </div>
      )}
    </motion.div>
  )
}
