import { expect } from "vitest";
import JSZip from "jszip";
import {
  generateReportsAnalyticsWorkbook,
  generateReportsAnalyticsZip,
} from "../../reports-analytics.export.service";

type AnalyticsDataset = Parameters<typeof generateReportsAnalyticsZip>[0];
type AnalyticsBlueprint = Parameters<typeof generateReportsAnalyticsZip>[2];

export async function expectReportsAnalyticsExports(
  result: AnalyticsDataset,
  fallbackBlueprint: AnalyticsBlueprint,
) {
  const zipBytes = await generateReportsAnalyticsZip(result, "es", fallbackBlueprint);
  const zip = await JSZip.loadAsync(zipBytes);
  const activitiesCsv = await zip.file("actividades_evaluaciones.csv")?.async("string");
  const learningCsv = await zip.file("tendencia_aprendizaje.csv")?.async("string");
  const courseCsv = await zip.file("progreso_cursos.csv")?.async("string");
  const executiveCsv = await zip.file("resumen_ejecutivo.csv")?.async("string");

  expect(activitiesCsv).toContain("Evaluaciones respondidas");
  expect(activitiesCsv).not.toContain("metric");
  expect(learningCsv).not.toContain("Vista");
  expect(learningCsv).not.toContain("#");
  expect(courseCsv).not.toContain("Vista");
  expect(courseCsv).not.toContain("#");
  expect(executiveCsv).toContain(fallbackBlueprint.summary);

  const workbookBytes = await generateReportsAnalyticsWorkbook(result, "es", fallbackBlueprint);
  expect(workbookBytes.length).toBeGreaterThan(1000);

  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(workbookBytes));
  const worksheetNames = workbook.worksheets.map((worksheet) => worksheet.name);
  expect(worksheetNames).toEqual(
    expect.arrayContaining([
      "Resumen SofLIA",
      "Dashboard",
      "Tendencias",
      "Cursos",
      "Usuarios",
      "Segmentos",
      "Calidad",
      "Datos crudos",
    ]),
  );

  const coursesSheet = workbook.getWorksheet("Cursos");
  expect(coursesSheet).toBeDefined();
  expect(() => coursesSheet?.getTable("CoursesTable")).not.toThrow();
  expect(coursesSheet?.autoFilter).toBeTruthy();
  expect(coursesSheet?.getColumn(1).width).toBeGreaterThan(30);
  expect(coursesSheet?.getCell("A1").value).toBe("Cursos");
}
