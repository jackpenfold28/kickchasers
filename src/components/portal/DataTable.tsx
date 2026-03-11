import { ReactNode } from 'react'

type Column<T> = {
  key: string
  label: string
  className?: string
  render: (row: T) => ReactNode
}

type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  emptyLabel?: string
}

export default function DataTable<T>({ columns, rows, getRowKey, emptyLabel = 'No rows.' }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-white/5">
          <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
            {columns.map((column) => (
              <th key={column.key} className={`px-3 py-3 ${column.className || ''}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <tr key={getRowKey(row)} className="border-t border-white/5 text-slate-200 hover:bg-white/[0.03]">
                {columns.map((column) => (
                  <td key={column.key} className={`px-3 py-3 align-top ${column.className || ''}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-3 py-6 text-center text-sm text-slate-400" colSpan={columns.length}>
                {emptyLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
