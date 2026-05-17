import type {
  CourseRatingSubmissionInput,
  RatingCheckResponse,
  SubmitRatingResponse,
} from './course-rating.types';

export type {
  CourseRating,
  CourseRatingSubmissionInput,
  RatingCheckResponse,
  SubmitRatingResponse,
} from './course-rating.types';

export class CourseRatingService {
  /**
   * Verifica si el usuario actual ya califico un curso
   * @param courseSlug Slug del curso
   * @returns Informacion sobre si el usuario ya califico y el rating si existe
   */
  static async checkUserRating(courseSlug: string): Promise<RatingCheckResponse> {
    try {
      const response = await fetch(`/api/courses/${courseSlug}/rating`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("No autorizado");
        }
        if (response.status === 404) {
          throw new Error("Curso no encontrado");
        }
        throw new Error("Error al verificar rating");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error checking user rating:", error);
      throw error;
    }
  }

  /**
   * Crea o actualiza el rating de un curso
   * @param courseSlug Slug del curso
   * @param submission Rating y reseña opcional
   * @returns Rating creado o actualizado
   */
  static async submitRating(
    courseSlug: string,
    submission: CourseRatingSubmissionInput
  ): Promise<SubmitRatingResponse> {
    try {
      const { rating, reviewTitle, reviewContent } = submission;

      if (!rating || rating < 1 || rating > 5) {
        throw new Error("El rating debe ser un numero entre 1 y 5");
      }

      const response = await fetch(`/api/courses/${courseSlug}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          rating: Math.round(rating),
          review_title: reviewTitle || null,
          review_content: reviewContent || null,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({
          error: "Error desconocido",
        }))) as { error?: string };

        if (response.status === 401) {
          throw new Error("No autorizado");
        }
        if (response.status === 403) {
          throw new Error("Debes estar inscrito en el curso para calificarlo");
        }
        if (response.status === 404) {
          throw new Error("Curso no encontrado");
        }
        if (response.status === 400) {
          throw new Error(errorData.error || "Datos invalidos");
        }
        throw new Error(errorData.error || "Error al guardar la calificacion");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error submitting rating:", error);
      throw error;
    }
  }
}
