
import type { Worksheet } from 'exceljs'
import type { ExcelTableColumn, ExportRow } from './export.types'
import { getColumnLetter, sanitizeTableName } from './export-utils'
import { applyCellFormat, coerceExcelValue, styleTableHeader } from './excel-format'

export function addExcelTable(
  sheet: Worksheet,
  tableName: string,
  startRow: number,
  startColumn: number,
  columns: ExcelTableColumn[],
  rows: ExportRow[],
): number {
  const safeRows = rows.length > 0 ? rows : [Object.fromEntries(columns.map((column) => [column.key, '']))]
  const tableRows = safeRows.map((row) => columns.map((column) => coerceExcelValue(row[column.key], column)))
  const ref = `${getColumnLetter(startColumn)}${startRow}`
  sheet.addTable({
    name: sanitizeTableName(tableName),
    ref,
    headerRow: true,
    totalsRow: false,
    style: {
      theme: 'TableStyleMedium2',
      showRowStripes: true,
    },
    columns: columns.map((column) => ({ name: column.header, filterButton: true })),
    rows: tableRows,
  })

  columns.forEach((column, index) => {
    const worksheetColumn = sheet.getColumn(startColumn + index)
    worksheetColumn.width = column.width || Math.min(Math.max(column.header.length + 4, 14), 42)
    for (let rowNumber = startRow + 1; rowNumber <= startRow + tableRows.length; rowNumber += 1) {
      const cell = sheet.getCell(rowNumber, startColumn + index)
      applyCellFormat(cell, column)
    }
    if (column.kind === 'percent' && tableRows.length > 0) {
      const col = getColumnLetter(startColumn + index)
      sheet.addConditionalFormatting({
        ref: `${col}${startRow + 1}:${col}${startRow + tableRows.length}`,
        rules: [
          {
            type: 'dataBar',
            priority: 1,
            showValue: true,
            cfvo: [
              { type: 'num', value: 0 },
              { type: 'num', value: 100 },
            ],
          },
        ],
      })
    }
  })

  styleTableHeader(sheet.getRow(startRow), startColumn, columns.length)
  sheet.autoFilter = {
    from: { row: startRow, column: startColumn },
    to: { row: startRow, column: startColumn + columns.length - 1 },
  }
  return startRow + tableRows.length + 1
}
