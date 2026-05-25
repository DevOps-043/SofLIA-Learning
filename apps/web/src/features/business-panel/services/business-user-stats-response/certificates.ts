import type { BusinessUserStatsCertificate } from '../../types/business-user-stats.types'
import type { BusinessUserStatsQueryData } from '../business-user-stats-query.service'
import { unwrapRelation } from '../business-user-stats-query.service'
import type { BusinessUserStatsInstructorMap } from './instructors'

export function buildEnrichedCertificates(
  data: Pick<BusinessUserStatsQueryData, 'certificates'>,
  instructorMap: BusinessUserStatsInstructorMap,
): BusinessUserStatsCertificate[] {
  return data.certificates.map((certificate) => {
    const course = unwrapRelation(certificate.courses)
    const instructor = course?.instructor_id ? instructorMap.get(course.instructor_id) : null

    return {
      certificate_id: certificate.certificate_id,
      certificate_url: certificate.certificate_url,
      certificate_hash: certificate.certificate_hash,
      course_id: certificate.course_id,
      issued_at: certificate.issued_at,
      expires_at: certificate.expires_at,
      course_title: course?.title || 'Curso sin t??tulo',
      course_slug: course?.slug || '',
      course_thumbnail: course?.thumbnail_url || null,
      instructor_name: instructor?.name || 'Instructor',
      instructor_username: instructor?.username || null,
    }
  })
}
