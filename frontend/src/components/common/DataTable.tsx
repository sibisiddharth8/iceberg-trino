import { useState } from 'react';
import type { FC, ReactNode } from 'react';
import { Copy, Check, FileSpreadsheet } from 'lucide-react';

export interface ColumnDef {
  key: string;
  label: string;
  type?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any, index: number) => ReactNode;
}

export interface DataTableProps {
  columns: ColumnDef[];
  data: any[][];
  maxHeight?: string;
  showIndex?: boolean;
  emptyMessage?: string;
  className?: string;
}

export const DataTable: FC<DataTableProps> = ({
  columns,
  data,
  maxHeight = '500px',
  showIndex = true,
  emptyMessage = 'No query results returned.',
  className = '',
}) => {
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  const handleCopyCell = (text: string, cellKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCell(cellKey);
    setTimeout(() => setCopiedCell(null), 1500);
  };

  const renderCellValue = (val: any, cellKey: string) => {
    if (val === null || val === undefined) {
      return (
        <span className="text-slate-400 italic text-[11px] bg-slate-100/70 px-1.5 py-0.5 rounded">
          null
        </span>
      );
    }

    if (typeof val === 'boolean') {
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
            val
              ? 'bg-sc-green-light text-sc-green border border-sc-green/20'
              : 'bg-rose-100 text-rose-700 border border-rose-200'
          }`}
        >
          {val ? 'TRUE' : 'FALSE'}
        </span>
      );
    }

    const strVal = String(val);

    // Status pill heuristics for financial workflows
    if (strVal === 'Success' || strVal === 'Completed' || strVal === 'Active') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sc-green-light text-sc-green border border-sc-green/20">
          <span className="w-1.5 h-1.5 rounded-full bg-sc-green mr-1.5" />
          {strVal}
        </span>
      );
    }

    if (strVal === 'Failed' || strVal === 'Rejected' || strVal === 'Error') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5" />
          {strVal}
        </span>
      );
    }

    if (strVal === 'Pending' || strVal === 'Processing') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5" />
          {strVal}
        </span>
      );
    }

    // Default text with hover copy option
    return (
      <span
        onClick={() => handleCopyCell(strVal, cellKey)}
        className="cursor-pointer hover:text-sc-blue transition-colors group flex items-center justify-between"
        title="Click to copy cell value"
      >
        <span className="truncate">{strVal}</span>
        {copiedCell === cellKey ? (
          <Check className="w-3 h-3 text-sc-green shrink-0 ml-1.5" />
        ) : (
          <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 shrink-0 ml-1.5" />
        )}
      </span>
    );
  };

  if (data.length === 0) {
    return (
      <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
        <FileSpreadsheet className="w-8 h-8 text-slate-300" />
        <span>{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div
      className={`overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs ${className}`}
      style={{ maxHeight }}
    >
      <table className="w-full text-left text-xs border-collapse">
        {/* Sticky Header */}
        <thead className="bg-slate-50 text-slate-700 sticky top-0 z-10 border-b border-slate-200 shadow-xs">
          <tr>
            {showIndex && (
              <th className="py-2.5 px-3 font-mono text-[11px] font-semibold text-slate-400 w-12 text-center border-r border-slate-200">
                #
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-2.5 px-4 font-mono font-bold tracking-wide border-r border-slate-200 last:border-r-0 ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-slate-900 font-semibold">{col.label}</span>
                  {col.type && (
                    <span className="text-[10px] text-slate-400 font-normal">
                      {col.type}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Rows */}
        <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
          {data.map((row, rIdx) => (
            <tr
              key={rIdx}
              className="hover:bg-sc-blue-light/20 transition-colors even:bg-slate-50/30"
            >
              {showIndex && (
                <td className="py-2.5 px-3 text-[11px] text-slate-400 text-center border-r border-slate-100 select-none bg-slate-50/40">
                  {rIdx + 1}
                </td>
              )}
              {row.map((cell, cIdx) => {
                const col = columns[cIdx];
                const cellKey = `${rIdx}-${cIdx}`;
                return (
                  <td
                    key={cIdx}
                    className={`py-2.5 px-4 border-r border-slate-100 last:border-r-0 truncate max-w-xs ${
                      col?.align === 'right'
                        ? 'text-right'
                        : col?.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    {col?.render
                      ? col.render(cell, row, rIdx)
                      : renderCellValue(cell, cellKey)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

