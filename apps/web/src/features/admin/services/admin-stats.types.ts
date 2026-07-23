// Métricas del dashboard de administración. Solo cubren entidades que existen en
// la plataforma B2B: usuarios, cursos, organizaciones y engagement. Las antiguas
// métricas de features de consumidor (AI apps, news, reels, favoritos) se
// retiraron junto con esas tablas; contarlas producía 404 en cada carga.
export interface AdminStats {
  totalUsers: number
  activeCourses: number
  totalOrganizations?: number
  engagementRate: number
}

export interface AdminStatsWithChanges extends AdminStats {
  userGrowth: number
  courseGrowth: number
  organizationGrowth?: number
}
