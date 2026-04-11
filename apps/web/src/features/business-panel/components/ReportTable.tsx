'use client'

import type { ReactNode } from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import { useState } from 'react'

import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { BusinessPanelSearchInput } from './shared/BusinessPanelSearchInput'

export interface ReportTableColumnMeta {
  mobileLabel?: string
  mobileOrder?: number
  mobileHidden?: boolean
  mobileCardTitle?: boolean
  mobileCardSubtitle?: boolean
}

export type ResponsiveReportColumnDef<T> = ColumnDef<T> & {
  meta?: ReportTableColumnMeta
}

function getMobileColumnLabel<T>(column: ResponsiveReportColumnDef<T>) {
  if (column.meta?.mobileLabel) {
    return column.meta.mobileLabel
  }

  if (typeof column.header === 'string') {
    return column.header
  }

  return column.id
}

interface ReportTableProps<T> {
  data: T[]
  columns: ResponsiveReportColumnDef<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  className?: string
}

export function ReportTable<T>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  className = '',
}: ReportTableProps<T>) {
  const panelTheme = useBusinessPanelTheme()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const rows = table.getRowModel().rows

  return (
    <div className={`space-y-4 ${className}`}>
      {searchable && (
        <BusinessPanelSearchInput
          value={globalFilter ?? ''}
          onChange={setGlobalFilter}
          placeholder={searchPlaceholder}
        />
      )}

      <div
        className="overflow-hidden rounded-[28px] border"
        style={{
          backgroundColor: panelTheme.cardBg,
          borderColor: panelTheme.borderColor,
        }}
      >
        <div
          className="hidden overflow-x-auto md:block"
          data-testid="report-table-desktop"
        >
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  style={{
                    backgroundColor: panelTheme.hoverBg,
                    borderBottom: `1px solid ${panelTheme.dividerColor}`,
                  }}
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]"
                      style={{ color: panelTheme.mutedTextColor }}
                      onClick={
                        header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <div className="inline-flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && (
                          <span className="inline-flex flex-col -space-y-1">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp
                                className="h-3.5 w-3.5"
                                style={{ color: panelTheme.actionColor }}
                              />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown
                                className="h-3.5 w-3.5"
                                style={{ color: panelTheme.actionColor }}
                              />
                            ) : (
                              <>
                                <ChevronUp
                                  className="h-3.5 w-3.5"
                                  style={{ color: panelTheme.mutedTextColor }}
                                />
                                <ChevronDown
                                  className="h-3.5 w-3.5"
                                  style={{ color: panelTheme.mutedTextColor }}
                                />
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-sm"
                    style={{ color: panelTheme.subtextColor }}
                  >
                    No hay datos para mostrar
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      borderBottom: `1px solid ${panelTheme.borderColor}`,
                      backgroundColor:
                        row.index % 2 === 0 ? 'transparent' : panelTheme.hoverBg,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-sm"
                        style={{ color: panelTheme.textColor }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          className="space-y-3 p-3 md:hidden"
          data-testid="report-table-mobile"
        >
          {rows.length === 0 ? (
            <div
              className="rounded-3xl border p-6 text-center text-sm"
              style={{
                backgroundColor: panelTheme.cardBg,
                borderColor: panelTheme.borderColor,
                color: panelTheme.subtextColor,
              }}
            >
              No hay datos para mostrar
            </div>
          ) : (
            rows.map((row) => {
              const mobileCells = row
                .getVisibleCells()
                .map((cell) => ({
                  cell,
                  meta:
                    (cell.column.columnDef.meta as ReportTableColumnMeta | undefined) ??
                    {},
                }))
                .filter(({ meta }) => !meta.mobileHidden)
                .sort(
                  (left, right) => (left.meta.mobileOrder ?? 0) - (right.meta.mobileOrder ?? 0),
                )

              const titleCell =
                mobileCells.find(({ meta }) => meta.mobileCardTitle) ?? mobileCells[0]
              const subtitleCell =
                mobileCells.find(
                  ({ cell, meta }) =>
                    meta.mobileCardSubtitle && cell.id !== titleCell?.cell.id,
                ) ?? mobileCells[1]

              const detailCells = mobileCells.filter(({ cell }) => {
                return (
                  cell.id !== titleCell?.cell.id && cell.id !== subtitleCell?.cell.id
                )
              })

              return (
                <div
                  key={row.id}
                  className="rounded-3xl border p-4"
                  style={{
                    backgroundColor: panelTheme.cardBg,
                    borderColor: panelTheme.borderColor,
                  }}
                >
                  {titleCell ? (
                    <div className="min-w-0">
                      <div
                        className="text-sm font-semibold"
                        style={{ color: panelTheme.textColor }}
                      >
                        {flexRender(
                          titleCell.cell.column.columnDef.cell,
                          titleCell.cell.getContext(),
                        )}
                      </div>
                      {subtitleCell ? (
                        <div
                          className="mt-2 text-sm"
                          style={{ color: panelTheme.subtextColor }}
                        >
                          {flexRender(
                            subtitleCell.cell.column.columnDef.cell,
                            subtitleCell.cell.getContext(),
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {detailCells.length > 0 ? (
                    <dl className="mt-4 space-y-3">
                      {detailCells.map(({ cell, meta }) => (
                        <div
                          key={cell.id}
                          className="flex items-start justify-between gap-4"
                        >
                          <dt
                            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                            style={{ color: panelTheme.mutedTextColor }}
                          >
                            {getMobileColumnLabel(
                              cell.column.columnDef as ResponsiveReportColumnDef<T>,
                            )}
                          </dt>
                          <dd
                            className="min-w-0 flex-1 text-right text-sm"
                            style={{ color: panelTheme.textColor }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </div>
              )
            })
          )}
        </div>

        {table.getPageCount() > 1 && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            style={{
              backgroundColor: panelTheme.hoverBg,
              borderTop: `1px solid ${panelTheme.dividerColor}`,
            }}
          >
            <div className="text-sm" style={{ color: panelTheme.subtextColor }}>
              Página {table.getState().pagination.pageIndex + 1} de{' '}
              {table.getPageCount()} ({table.getFilteredRowModel().rows.length}{' '}
              resultados)
            </div>

            <div className="flex items-center gap-2">
              <PaginationButton
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                panelTheme={panelTheme}
                icon={<ChevronLeft className="h-4 w-4" />}
              />
              <PaginationButton
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                panelTheme={panelTheme}
                icon={<ChevronRight className="h-4 w-4" />}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PaginationButton({
  disabled,
  onClick,
  panelTheme,
  icon,
}: {
  disabled: boolean
  onClick: () => void
  panelTheme: ReturnType<typeof useBusinessPanelTheme>
  icon: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border p-2 disabled:cursor-not-allowed disabled:opacity-45"
      style={{
        backgroundColor: panelTheme.cardBg,
        borderColor: panelTheme.borderColor,
        color: panelTheme.textColor,
      }}
    >
      {icon}
    </button>
  )
}
