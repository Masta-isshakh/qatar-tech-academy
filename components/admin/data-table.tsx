'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { toCsv } from '@/lib/utils'
import { cn } from '@/lib/utils'

/**
 * One table for every admin list: search, sort, pagination, row selection and a
 * CSV export of the rows currently matching the filter.
 */
export function DataTable<T extends { id: string }>({
  data,
  columns,
  csvColumns,
  csvName,
  toolbar,
  onSelectionChange,
  emptyLabel,
}: {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  csvColumns?: string[]
  csvName?: string
  toolbar?: (selectedIds: string[]) => React.ReactNode
  onSelectionChange?: (ids: string[]) => void
  emptyLabel?: string
}) {
  const t = useTranslations('admin')
  const tc = useTranslations('common')
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting, rowSelection },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater
      setRowSelection(next)
      onSelectionChange?.(
        Object.entries(next)
          .filter(([, v]) => v)
          .map(([k]) => data[Number(k)]?.id)
          .filter((id): id is string => Boolean(id))
      )
    },
    getRowId: (row, index) => String(index),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  })

  const selectedIds = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, v]) => v)
        .map(([k]) => data[Number(k)]?.id)
        .filter((id): id is string => Boolean(id)),
    [rowSelection, data]
  )

  function exportCsv() {
    const cols = csvColumns ?? Object.keys(data[0] ?? { id: '' })
    const rows = table.getFilteredRowModel().rows.map((r) => r.original as Record<string, unknown>)
    // BOM so Excel opens the Arabic columns as UTF-8.
    const blob = new Blob(['﻿' + toCsv(rows, cols)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${csvName ?? 'export'}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={tc('search')}
          className="max-w-xs"
        />
        {selectedIds.length > 0 ? (
          <span className="text-muted text-sm">{t('selected', { count: selectedIds.length })}</span>
        ) : null}
        <div className="ms-auto flex items-center gap-2">
          {toolbar?.(selectedIds)}
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={data.length === 0}>
            <Download className="size-4" aria-hidden />
            {t('exportCsv')}
          </Button>
        </div>
      </div>

      <p className="text-muted text-xs">{t('dataExportNote')}</p>

      <div className="border-border-subtle overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[48rem] border-collapse text-sm">
          <thead className="bg-surface">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sortable = header.column.getCanSort()
                  const dir = header.column.getIsSorted()
                  return (
                    <th key={header.id} scope="col" className="px-3 py-2.5 text-start font-bold">
                      {header.isPlaceholder ? null : sortable ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="hover:text-primary inline-flex items-center gap-1"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {dir === 'asc' ? (
                            <ChevronUp className="size-3.5" aria-hidden />
                          ) : dir === 'desc' ? (
                            <ChevronDown className="size-3.5" aria-hidden />
                          ) : null}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-muted px-3 py-8 text-center">
                  {emptyLabel ?? t('noRows')}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-border-subtle border-t align-middle',
                    row.getIsSelected() && 'bg-maroon-soft'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="ltr-nums text-muted">
          {table.getState().pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {tc('previous')}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {tc('next')}
          </Button>
        </div>
      </div>
    </div>
  )
}
