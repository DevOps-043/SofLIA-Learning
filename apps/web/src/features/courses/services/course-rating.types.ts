export interface CourseRating {
  review_id: string
  rating: number
  review_title?: string | null
  review_content: string
  created_at: string
  updated_at: string
}

export interface RatingCheckResponse {
  success: boolean
  hasRating: boolean
  rating: CourseRating | null
}

export interface SubmitRatingResponse {
  success: boolean
  rating: CourseRating
  message: string
}

export interface CourseRatingSubmissionInput {
  rating: number
  reviewTitle?: string
  reviewContent?: string
}
