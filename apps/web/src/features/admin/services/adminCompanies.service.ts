export type {
  AdminCompany,
  AdminCompanyMember,
  AdminCompanyUserProfile,
  CompanyCreatePayload,
  CompanyDetailedStats,
  CompanyStats,
  CompanyUpdatePayload,
} from '../types/admin-companies.types'

import type {
  AdminCompany,
  CompanyCreatePayload,
  CompanyStats,
  CompanyUpdatePayload,
} from '../types/admin-companies.types'
import {
  assignCourseToCompany,
  assignCourseToUser,
  calculateCompanyStats,
  createAdminCompany,
  getAdminCompanies,
  getAdminCompanyById,
  getCompanyCourses,
  getCompanyDetailedStats,
  getUserCourseAssignments,
  removeCourseFromCompany,
  removeCourseFromUser,
  updateAdminCompany,
} from './admin-companies/server'

export class AdminCompaniesService {
  static async getCompanies(): Promise<AdminCompany[]> {
    return getAdminCompanies()
  }

  static calculateStats(companies: AdminCompany[]): CompanyStats {
    return calculateCompanyStats(companies)
  }

  static async getCompanyById(id: string): Promise<AdminCompany | null> {
    return getAdminCompanyById(id)
  }

  static async updateCompany(id: string, updates: CompanyUpdatePayload): Promise<AdminCompany> {
    return updateAdminCompany(id, updates)
  }

  static async createCompany(data: CompanyCreatePayload): Promise<AdminCompany> {
    return createAdminCompany(data)
  }

  static async getCompanyCourses(id: string) {
    return getCompanyCourses(id)
  }

  static async assignCourseToCompany(companyId: string, courseId: string, adminId: string) {
    return assignCourseToCompany(companyId, courseId, adminId)
  }

  static async removeCourseFromCompany(companyId: string, courseId: string) {
    return removeCourseFromCompany(companyId, courseId)
  }

  static async getUserCourseAssignments(companyId: string) {
    return getUserCourseAssignments(companyId)
  }

  static async assignCourseToUser(companyId: string, userId: string, courseId: string, adminId: string) {
    return assignCourseToUser(companyId, userId, courseId, adminId)
  }

  static async removeCourseFromUser(assignmentId: string) {
    return removeCourseFromUser(assignmentId)
  }

  static async getCompanyDetailedStats(companyId: string) {
    return getCompanyDetailedStats(companyId)
  }
}
