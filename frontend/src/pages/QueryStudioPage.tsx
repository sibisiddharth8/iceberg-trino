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
  History,
} from 'lucide-react';
import { useLakehouse } from '../context/LakehouseContext';
import { queryService, AppApiError } from '../services';
import { Loader, DataTable, Card } from '../components/common';
import type { QueryResultData } from '../types';

export function QueryStudioPage() {
  const { tables, injectedQuery, setInjectedQuery, openHistoryModal, isInitialLoading } = useLakehouse();
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
      name: '⏳ Iceberg Version Time-Travel',
      desc: 'Queries table as of an earlier snapshot version ID (e.g. 50 records)',
      sql: `-- Query transactions table exactly as it existed at Version 1 (50 rows)
-- In Iceberg + Trino, use: FOR VERSION AS OF <snapshot_id>
SELECT 
    transaction_id,
    customer_id,
    transaction_date,
    transaction_amount,
    transaction_status
FROM iceberg.banking.transactions FOR VERSION AS OF 8278352813902851825
LIMIT 25`,
    },
    {
      name: '🔍 Version Diff (V2 minus V1)',
      desc: 'Returns only the newly added records in Version 2',
      sql: `-- Returns only the 100 records added in Version 2 (Head Version minus Version 1)
SELECT transaction_id, customer_id, transaction_amount, transaction_date, merchant_category
FROM iceberg.banking.transactions FOR VERSION AS OF 810541187169676779
EXCEPT
SELECT transaction_id, customer_id, transaction_amount, transaction_date, merchant_category
FROM iceberg.banking.transactions FOR VERSION AS OF 8278352813902851825
LIMIT 25`,
    },
    {
      name: '📜 Table Snapshots Audit Log',
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
      const data = await queryService.executeSql(query.trim(), maxRows);
      setResult(data);
    } catch (err: any) {
      if (err instanceof AppApiError) {
        setQueryError(err.message);
      } else {
        setQueryError(err?.message || 'Query execution failed');
      }
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
      <Card className="flex flex-wrap items-center gap-2 p-3 shadow-xs">
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
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Schema Explorer */}
        <Card className="lg:col-span-4 xl:col-span-3 p-4 flex flex-col h-[650px] shadow-xs">
          <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-100">
            <Database className="w-4 h-4 text-sc-blue shrink-0" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider truncate">
              Catalog Schema Explorer
            </h3>
          </div>

          {isInitialLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <Loader
                variant="card"
                size="md"
                color="sc"
                text="Scanning Catalog..."
                subtext="Fetching tables & columns..."
              />
            </div>
          ) : tables.length === 0 ? (
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
                      className="w-full px-3 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors gap-2"
                    >
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${
                            isSelected ? 'rotate-90 text-sc-green' : ''
                          }`}
                        />
                        <span className="text-xs font-mono font-bold text-slate-800 truncate" title={tbl.tableName}>
                          {tbl.tableName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-sc-green font-semibold bg-sc-green-light px-2 py-0.5 rounded-full border border-sc-green/20 shrink-0">
                        {tbl.totalRows.toLocaleString()}
                      </span>
                    </button>

                    {isSelected && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50 space-y-1">
                        <div className="flex items-center justify-between gap-1 mb-1 pb-1 border-b border-slate-200/70 text-[10px]">
                          <button
                            onClick={() => openHistoryModal(tbl.tableName)}
                            className="text-sc-blue hover:text-sc-blue-hover font-bold flex items-center space-x-1 shrink-0"
                            title="View all snapshot version IDs and time-travel queries"
                          >
                            <History className="w-3 h-3 text-sc-green" />
                            <span>Lineage ({tbl.snapshotCount})</span>
                          </button>
                          <button
                            onClick={() => insertText(`iceberg.${tbl.identifier}`)}
                            className="text-slate-500 hover:text-slate-800 font-semibold truncate shrink-0"
                          >
                            + Insert
                          </button>
                        </div>
                        {tbl.columns.map((col) => (
                          <div
                            key={col.name}
                            onClick={() => insertText(col.name)}
                            className="flex items-center justify-between py-1 px-1.5 rounded-md hover:bg-white cursor-pointer text-[11px] group transition-colors border border-transparent hover:border-slate-200 gap-2"
                            title="Click to insert column into SQL"
                          >
                            <span className="text-slate-700 font-mono group-hover:text-sc-blue font-medium truncate" title={col.name}>
                              {col.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
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
        </Card>

        {/* Right: SQL Editor & Output */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col space-y-6">
          {/* SQL Editor Card */}
          <Card className="p-5 shadow-xs flex flex-col space-y-3.5">
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
                  <Loader
                    size="sm"
                    color="white"
                    variant="inline"
                    text="Executing on Trino..."
                  />
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Execute Query</span>
                  </>
                )}
              </button>
            </div>
          </Card>

          {/* While executing: Loading State */}
          {isExecuting && (
            <Card className="p-8 shadow-xs animate-in fade-in">
              <Loader
                variant="card"
                size="lg"
                color="sc"
                text="Executing Distributed SQL Query on Trino"
                subtext="Planning query execution, scanning Iceberg manifest lists, and aggregating row splits across MinIO..."
              />
            </Card>
          )}

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
            <Card className="p-5 shadow-xs space-y-4 animate-in fade-in">
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
              <DataTable
                columns={result.columns.map((col) => ({
                  key: col.name,
                  label: col.name,
                  type: col.type,
                }))}
                data={result.rows}
                maxHeight="520px"
                showIndex={true}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

