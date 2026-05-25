export const reportsAnalyticsBlueprintJson = JSON.stringify({
  summary: "SofLIA encontro riesgo en cursos y oportunidad de seguimiento.",
  sections: [
    {
      id: "executive",
      title: "Resumen directivo",
      purpose: "Priorizar acciones",
      priority: 1,
    },
    {
      id: "courses",
      title: "Cursos",
      purpose: "Revisar avance",
      priority: 2,
    },
  ],
  featuredMetrics: [{ label: "Progreso", value: "50%", detail: "Prueba" }],
  findings: [{ title: "Hallazgo", points: ["Punto operativo"] }],
  risks: ["Riesgo operativo"],
  recommendations: ["Accion recomendada"],
  artifactPlan: [
    {
      id: "executive",
      title: "Resumen directivo",
      description: "Resumen",
      includeInCsv: true,
      includeInWorkbook: true,
    },
  ],
});
