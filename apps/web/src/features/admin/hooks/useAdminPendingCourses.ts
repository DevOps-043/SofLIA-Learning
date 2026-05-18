import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useCallback, useEffect } from 'react'
import { getPendingCourses, approveCourse as approveCourseAction, rejectCourse as rejectCourseAction, deleteCourse as deleteCourseAction, AdminCourse } from '../actions/adminCourses.actions'

interface UseAdminPendingCoursesReturn {
    courses: AdminCourse[]
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
    approveCourse: (id: string, adminId: string) => Promise<boolean>
    rejectCourse: (id: string, reason: string) => Promise<boolean>
    deleteCourse: (id: string) => Promise<boolean>
}

export function useAdminPendingCourses(): UseAdminPendingCoursesReturn {
    const [courses, setCourses] = useState<AdminCourse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCourses = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)
            const data = await getPendingCourses()
            setCourses(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar cursos pendientes')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCourses()
    }, [fetchCourses])

    const approveCourse = async (id: string, adminId: string) => {
        try {
            const success = await approveCourseAction(id, adminId)
            if (success) {
                await fetchCourses()
                return true
            }
            return false
        } catch (err) {
            techDebtLogger.error(err)
            return false
        }
    }

    const rejectCourse = async (id: string, reason: string) => {
        try {
            const success = await rejectCourseAction(id, reason)
            if (success) {
                await fetchCourses()
                return true
            }
            return false
        } catch (err) {
            techDebtLogger.error(err)
            return false
        }
    }

    const deleteCourse = async (id: string) => {
        try {
            const success = await deleteCourseAction(id)
            if (success) {
                await fetchCourses()
                return true
            }
            return false
        } catch (err) {
            techDebtLogger.error(err)
            return false
        }
    }

    return {
        courses,
        isLoading,
        error,
        refetch: fetchCourses,
        approveCourse,
        rejectCourse,
        deleteCourse
    }
}
