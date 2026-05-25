
import type { Cell, Row } from 'exceljs'
import { EXCEL_COLORS } from './export.colors'
import type { ExcelTableColumn } from './export.types'

export function coerceExcelValue(value: unknown, column: ExcelTableColumn): string | number | Date {
  if (value === null || value === undefined) return ''
  if (column.kind === 'date') {
    const date = new Date(String(value))
    return Number.isNaN(date.getTime()) ? '' : date
  }
  if (column.kind === 'integer' || column.kind === 'decimal' || column.kind === 'percent') {
    if (typeof value === 'number') return value
    const parsed = Number.parseFloat(String(value).replace('%', ''))
    return Number.isFinite(parsed) ? parsed : String(value)
  }
  return typeof value === 'string' || typeof value === 'number' ? value : JSON.stringify(value)
}

export function applyCellFormat(cell: Cell, column: ExcelTableColumn): void {
  cell.alignment = { vertical: 'middle', wrapText: column.kind === 'text' }
  applyBorder(cell)
  if (column.numberFormat) {
    cell.numFmt = column.numberFormat
    return
  }
  if (column.kind === 'integer') cell.numFmt = '#,##0'
  if (column.kind === 'decimal') cell.numFmt = '#,##0.0'
  if (column.kind === 'percent') cell.numFmt = '0.0"%"'
  if (column.kind === 'date') cell.numFmt = 'yyyy-mm-dd hh:mm'
}

export function styleTableHeader(row: Row, startColumn: number, columnCount: number): void {
  row.height = 24
  for (let index = 0; index < columnCount; index += 1) {
    const cell = row.getCell(startColumn + index)
    cell.font = { bold: true, color: { argb: EXCEL_COLORS.white } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.primary } }
    cell.alignment = { vertical: 'middle', wrapText: true }
    applyBorder(cell)
  }
}

export function applyBorder(cell: Cell): void {
  cell.border = {
    top: { style: 'thin', color: { argb: EXCEL_COLORS.border } },
    left: { style: 'thin', color: { argb: EXCEL_COLORS.border } },
    bottom: { style: 'thin', color: { argb: EXCEL_COLORS.border } },
    right: { style: 'thin', color: { argb: EXCEL_COLORS.border } },
  }
}
