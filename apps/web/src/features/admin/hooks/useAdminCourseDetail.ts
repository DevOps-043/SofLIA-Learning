
import { useState, useCallback, useEffect } from 'react'
import { getStagingDetails, approveCourse as approveCourseAction, rejectCourse as rejectCourseAction, deleteCourse as deleteCourseAction, reconsiderCourse as reconsiderCourseAction } from '../actions/adminCourses.actions'

export function useAdminCourseDetail(courseId: string) {
    const [course, setCourse] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCourse = useCallback(async () => {
        if (!courseId) return
        try {
            setIsLoading(true)
            setError(null)
            const data = await getStagingDetails(courseId)
            if (!data) throw new Error('Curso no encontrado')
            setCourse(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar detalles del curso')
        } finally {
            setIsLoading(false)
        }
    }, [courseId])

    useEffect(() => {
        fetchCourse()
    }, [fetchCourse])

    const approveCourse = async (adminId: string) => {
        try {
            const success = await approveCourseAction(courseId, adminId)
            if (success) {
                await fetchCourse() // Recargar para ver nuevo estado
                return true
            }
            return false
        } catch (err) {
            console.error(err)
            return false
        }
    }

    const rejectCourse = async (reason: string) => {
        try {
            const success = await rejectCourseAction(courseId, reason)
            if (success) {
                await fetchCourse()
                return true
            }
            return false
        } catch (err) {
            console.error(err)
            return false
        }
    }

    const deleteCourse = async (): Promise<boolean> => {
        try {
            const success = await deleteCourseAction(courseId)
            if (success) {
                // No refetch needed if we redirect, but for flexibility:
                return true
            }
            return false
        } catch (err) {
            console.error(err)
            return false
        }
    }

    const reconsiderCourse = async (): Promise<boolean> => {
        try {
            const success = await reconsiderCourseAction(courseId)
            if (success) {
                await fetchCourse()
                return true
            }
            return false
        } catch (err) {
            console.error(err)
            return false
        }
    }

    return {
        course,
        isLoading,
        error,
        refetch: fetchCourse,
        approveCourse,
        rejectCourse,
        deleteCourse,
        reconsiderCourse
    }
}
