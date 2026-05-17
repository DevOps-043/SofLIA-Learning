
import type { Workbook, Worksheet } from 'exceljs'
import { EXCEL_COLORS } from './export.colors'
import { getColumnLetter, sanitizeSheetName } from './export-utils'
import { applyBorder } from './excel-format'

export function addStyledWorksheet(workbook: Workbook, name: string): Worksheet {
  const sheet = workbook.addWorksheet(sanitizeSheetName(name))
  sheet.properties.defaultRowHeight = 20
  sheet.views = [{ state: 'frozen', ySplit: 5 }]
  sheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  }
  sheet.eachRow((row) => {
    row.alignment = { vertical: 'middle' }
  })
  return sheet
}

export function setColumns(sheet: Worksheet, widths: number[]): void {
  sheet.columns = widths.map((width) => ({ width }))
}

export function addTitleBlock(sheet: Worksheet, title: string, lines: string[], columnSpan: number): void {
  const endColumn = getColumnLetter(columnSpan)
  sheet.mergeCells(`A1:${endColumn}1`)
  sheet.getCell('A1').value = title
  sheet.getCell('A1').font = { bold: true, size: 18, color: { argb: EXCEL_COLORS.white } }
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.primary } }
  sheet.getCell('A1').alignment = { vertical: 'middle' }
  sheet.getRow(1).height = 30

  lines.slice(0, 3).forEach((line, index) => {
    const rowNumber = index + 2
    sheet.mergeCells(`A${rowNumber}:${endColumn}${rowNumber}`)
    const cell = sheet.getCell(rowNumber, 1)
    cell.value = line
    cell.font = { color: { argb: EXCEL_COLORS.muted }, size: 10 }
    cell.alignment = { wrapText: true }
  })
}

export function addMetricCard(
  sheet: Worksheet,
  row: number,
  column: number,
  label: string,
  value: string | number,
  detail: string,
): void {
  const endColumn = column + 2
  sheet.mergeCells(row, column, row, endColumn)
  sheet.mergeCells(row + 1, column, row + 1, endColumn)
  sheet.mergeCells(row + 2, column, row + 2, endColumn)
  const labelCell = sheet.getCell(row, column)
  const valueCell = sheet.getCell(row + 1, column)
  const detailCell = sheet.getCell(row + 2, column)
  labelCell.value = label
  valueCell.value = value
  detailCell.value = detail
  labelCell.font = { bold: true, color: { argb: EXCEL_COLORS.muted }, size: 9 }
  valueCell.font = { bold: true, color: { argb: EXCEL_COLORS.primary }, size: 18 }
  detailCell.font = { color: { argb: EXCEL_COLORS.muted }, size: 9 }
  for (let rowIndex = row; rowIndex <= row + 2; rowIndex += 1) {
    for (let colIndex = column; colIndex <= endColumn; colIndex += 1) {
      const cell = sheet.getCell(rowIndex, colIndex)
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.surface } }
      applyBorder(cell)
    }
  }
}

export function addSectionList(sheet: Worksheet, startRow: number, title: string, rows: string[]): number {
  sheet.getCell(startRow, 1).value = title
  sheet.getCell(startRow, 1).font = { bold: true, color: { argb: EXCEL_COLORS.primary }, size: 12 }
  rows.slice(0, 16).forEach((row, index) => {
    const rowNumber = startRow + index + 1
    sheet.mergeCells(`A${rowNumber}:H${rowNumber}`)
    const cell = sheet.getCell(rowNumber, 1)
    cell.value = row
    cell.alignment = { wrapText: true }
    cell.font = { color: { argb: EXCEL_COLORS.text } }
  })
  return startRow + rows.slice(0, 16).length + 1
}
