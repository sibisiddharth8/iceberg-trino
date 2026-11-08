import { useState, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Play,
  Database,
  Clock,
  Download,
  AlertCircle,
  Code2,
  ChevronRight,
  Sparkles,
  Search,
  Check,
} from 'lucide-react';
import { useLakehouse } from '../context/LakehouseContext';
import type { QueryResultData } from '../types';

export function QueryStudioPage() {
  const { tables, injectedQuery, setInjectedQuery } = useLakehouse();
  const [searchParams] = useSearchParams();

  const defaultSql = `SELECT 
    c.customer_id,
    c.state,
    c.credit_score,
    c.kyc_status,
    COUNT(t.transaction_id) AS txn_count,
    SUM(t.transaction_amount) AS total_volume
FROM iceberg.banking.customers c
JOIN iceberg.banking.transactions t ON c.customer_id = t.customer_id
WHERE t.transaction_status = 'Success'
GROUP BY c.customer_id, c.state, c.credit_score, c.kyc_status
ORDER BY total_volume DESC
LIMIT 50`;

  const [query, setQuery] = useState(defaultSql);
  const [maxRows, setMaxRows] = useState(500);
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<QueryResultData | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [selectedTableForExplorer, setSelectedTableForExplorer] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // If query injected from time-travel or URL param
  useEffect(() => {
    if (injectedQuery) {
      setQuery(injectedQuery);
      setInjectedQuery(null);
    }
  }, [injectedQuery, setInjectedQuery]);

  // If URL has ?table=xyz
  useEffect(() => {
    const tableParam = searchParams.get('table');
    if (tableParam) {
      setQuery(`SELECT * FROM iceberg.banking.${tableParam} LIMIT 50`);
      setSelectedTableForExplorer(`banking.${tableParam}`);
    } else if (tables.length > 0 && !selectedTableForExplorer) {
      setSelectedTableForExplorer(tables[0].identifier);
    }
  }, [searchParams, tables]);

  const queryPresets = [
    {
      name: '🔗 2-Table Relational JOIN',
      desc: 'Joins customers with transactions by customer_id',
      sql: `SELECT 
    c.customer_id,
    c.state,
    c.credit_score,
    c.kyc_status,
    COUNT(t.transaction_id) AS txn_count,
    SUM(t.transaction_amount) AS total_volume
FROM iceberg.banking.customers c
JOIN iceberg.banking.transactions t ON c.customer_id = t.customer_id
WHERE t.transaction_status = 'Success'
GROUP BY c.customer_id, c.state, c.credit_score, c.kyc_status
ORDER BY total_volume DESC
LIMIT 50`,
    },
    {
      name: '📊 State Spending Aggregation',
      desc: 'Aggregates volume and average balance by Indian state',
      sql: `SELECT 
    state,
    COUNT(transaction_id) AS total_txns,
    SUM(transaction_amount) AS total_spent,
    ROUND(AVG(account_balance), 2) AS avg_balance
FROM iceberg.banking.transactions
GROUP BY state
ORDER BY total_spent DESC`,
    },
    {
      name: '⏳ Iceberg Snapshots & History',
      desc: 'Inspects Iceberg internal snapshot metadata directly from Trino',
      sql: `SELECT 
    snapshot_id,
    committed_at,
    operation,
    summary['added-records'] AS added_records,
    summary['total-records'] AS total_records
FROM iceberg.banking."transactions$snapshots"
ORDER BY committed_at DESC`,
    },
    {
      name: '⚡ Simple Scan & Limit',
      desc: 'Fast 25 rows scan from transactions table',
      sql: `SELECT 
    transaction_id,
    customer_id,
    transaction_date,
    transaction_type,
    transaction_amount,
    merchant_category,
    transaction_status
FROM iceberg.banking.transactions
LIMIT 25`,
    },
  ];

  const handleRunQuery = async () => {
    if (!query.trim()) return;

    setIsExecuting(true);
    setQueryError(null);
    setResult(null);

    try {
      const res = await fetch('/api/query/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), limit: maxRows }),
      });

      const body = await res.json();

      if (!res.ok || !body.success) {
        setQueryError(body?.error?.message || body?.message || 'Query execution failed');
        return;
      }

      setResult(body.data as QueryResultData);
    } catch (err: any) {
      setQueryError(err.message || 'Network error occurred');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunQuery();
    }
  };

  const handleExportCSV = () => {
    if (!result || result.rows.length === 0) return;

    const headers = result.columns.map((c) => `"${c.name}"`).join(',');
    const rows = result.rows
      .map((row) =>
        row
          .map((val) => {
            if (val === null || val === undefined) return '""';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(',')
      )
      .join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(`${headers}\n${rows}`);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `query_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const insertText = (text: string) => {
    setQuery((prev) => prev + ` ${text}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          SQL Query Studio
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Execute distributed ANSI SQL across Iceberg tables via Trino engine. Supports multi-table JOINs, aggregations, window functions, and snapshot time travel.
        </p>
      </div>

      {/* Presets Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
        <div className="flex items-center space-x-1.5 px-2 text-xs font-bold text-slate-700">
          <Sparkles className="w-4 h-4 text-sc-green" />
          <span>Quick Query Presets:</span>
        </div>
        {queryPresets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => setQuery(preset.sql)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 hover:bg-sc-blue-light text-slate-700 hover:text-sc-blue rounded-lg border border-slate-200 hover:border-sc-blue/30 transition-all cursor-pointer"
            title={preset.desc}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Schema Explorer */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col h-[650px] shadow-xs">
          <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-100">
            <Database className="w-4 h-4 text-sc-blue" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Catalog Schema Explorer
            </h3>
          </div>

          {tables.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs flex-1 flex flex-col items-center justify-center">
              <Search className="w-6 h-6 mb-2 text-slate-300" />
              <span>No tables in catalog.</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {tables.map((tbl) => {
                const isSelected = selectedTableForExplorer === tbl.identifier;
                return (
                  <div
                    key={tbl.identifier}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs"
                  >
                    <button
                      onClick={() =>
                        setSelectedTableForExplorer(
                          isSelected ? null : tbl.identifier
                        )
                      }
                      className="w-full px-3 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                            isSelected ? 'rotate-90 text-sc-green' : ''
                          }`}
                        />
                        <span className="text-xs font-mono font-bold text-slate-800 truncate">
                          {tbl.tableName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-sc-green font-semibold bg-sc-green-light px-2 py-0.5 rounded-full border border-sc-green/20">
                        {tbl.totalRows.toLocaleString()}
                      </span>
                    </button>

                    {isSelected && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50 space-y-1">
                        <div className="flex justify-end mb-1">
                          <button
                            onClick={() => insertText(`iceberg.${tbl.identifier}`)}
                            className="text-[10px] text-sc-blue hover:text-sc-blue-hover font-semibold"
                          >
                            + Insert table name
                          </button>
                        </div>
                        {tbl.columns.map((col) => (
                          <div
                            key={col.name}
                            onClick={() => insertText(col.name)}
                            className="flex items-center justify-between py-1 px-1.5 rounded-md hover:bg-white cursor-pointer text-[11px] group transition-colors border border-transparent hover:border-slate-200"
                            title="Click to insert column into SQL"
                          >
                            <span className="text-slate-700 font-mono group-hover:text-sc-blue font-medium">
                              {col.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {col.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: SQL Editor & Output */}
        <div className="lg:col-span-9 flex flex-col space-y-6">
          {/* SQL Editor Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-sc-navy" />
                <span className="text-xs font-bold text-slate-800">
                  ANSI SQL Editor (Trino Engine)
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="text-slate-400 text-[11px] hidden sm:inline">
                  Shortcuts: <kbd className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono">Ctrl + Enter</kbd> to run
                </span>
                <select
                  value={maxRows}
                  onChange={(e) => setMaxRows(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-sc-blue"
                >
                  <option value={50}>Limit 50 rows</option>
                  <option value={100}>Limit 100 rows</option>
                  <option value={500}>Limit 500 rows</option>
                  <option value={1000}>Limit 1000 rows</option>
                </select>
              </div>
            </div>

            {/* Code Textarea */}
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={9}
                spellCheck={false}
                placeholder="Write your SELECT or JOIN query here..."
                className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-sc-blue/40 leading-relaxed resize-y shadow-inner"
              />
            </div>

            {/* Run Query Action Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Clear Query
              </button>
              <button
                type="button"
                onClick={handleRunQuery}
                disabled={isExecuting || !query.trim()}
                className="py-2.5 px-6 rounded-xl font-semibold text-xs text-white bg-sc-green hover:bg-sc-green-hover active:scale-[0.99] transition-all flex items-center space-x-2 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isExecuting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Executing on Trino...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Execute Query</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {queryError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-900 uppercase">
                  Trino Execution Error
                </h4>
                <p className="text-xs font-mono text-rose-700 mt-1 whitespace-pre-wrap leading-relaxed">
                  {queryError}
                </p>
              </div>
            </div>
          )}

          {/* Results Grid */}
          {result && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-4 text-xs font-mono">
                  <div className="flex items-center space-x-1.5 text-sc-green font-bold">
                    <span className="w-2 h-2 rounded-full bg-sc-green animate-pulse" />
                    <span>{result.rowCount} rows returned</span>
                  </div>
                  <div className="flex items-center space-x-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{result.durationMs} ms</span>
                  </div>
                  {result.queryId && (
                    <span className="text-slate-400 hidden md:inline truncate max-w-xs">
                      ID: {result.queryId}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleExportCSV}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copiedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-sc-green" />
                      <span className="text-sc-green">Exported!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </>
                  )}
                </button>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto max-h-[500px] rounded-xl border border-slate-200 bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-mono text-[11px] text-slate-400 w-12 text-center border-r border-slate-200">
                        #
                      </th>
                      {result.columns.map((col) => (
                        <th
                          key={col.name}
                          className="py-2.5 px-4 font-mono font-bold tracking-wide border-r border-slate-200 last:border-r-0"
                        >
                          <div className="flex flex-col">
                            <span className="text-slate-900">{col.name}</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              {col.type}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                    {result.rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/80 transition-colors even:bg-slate-50/40"
                      >
                        <td className="py-2.5 px-3 text-[11px] text-slate-400 text-center border-r border-slate-100">
                          {idx + 1}
                        </td>
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="py-2.5 px-4 border-r border-slate-100 last:border-r-0 truncate max-w-xs"
                          >
                            {cell === null || cell === undefined ? (
                              <span className="text-slate-400 italic">null</span>
                            ) : typeof cell === 'boolean' ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  cell
                                    ? 'bg-sc-green-light text-sc-green'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {cell ? 'TRUE' : 'FALSE'}
                              </span>
                            ) : (
                              String(cell)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

