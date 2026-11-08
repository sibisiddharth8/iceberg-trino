import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Database,
  History,
  Terminal,
  Columns3,
  Search,
} from 'lucide-react';
import { useLakehouse } from '../context/LakehouseContext';

export function CatalogPage() {
  const { tables, openHistoryModal } = useLakehouse();
  const [searchParams] = useSearchParams();
  const initialTable = searchParams.get('table');

  const [searchFilter, setSearchFilter] = useState('');
  const [activeTableIdent, setActiveTableIdent] = useState<string | null>(
    initialTable ? `banking.${initialTable}` : tables[0]?.identifier || null
  );

  const filteredTables = tables.filter((t) =>
    t.identifier.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const activeTable =
    tables.find((t) => t.identifier === activeTableIdent) || tables[0] || null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Iceberg Catalog & Schema Explorer
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Inspect schemas, field definitions, metadata snapshots, and storage locations for all registered Apache Iceberg tables in the banking namespace.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Table List */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col h-[650px]">
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter catalog tables..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sc-blue/30 focus:border-sc-blue"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredTables.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No tables match your search.
              </p>
            ) : (
              filteredTables.map((tbl) => {
                const isActive = activeTable?.identifier === tbl.identifier;
                return (
                  <button
                    key={tbl.identifier}
                    onClick={() => setActiveTableIdent(tbl.identifier)}
                    className={`w-full p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-sc-blue-light/50 border-sc-blue shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {tbl.tableName}
                      </span>
                      <span className="text-[10px] font-mono text-sc-green font-semibold bg-sc-green-light px-2 py-0.5 rounded-full">
                        {tbl.totalRows.toLocaleString()} rows
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-2 font-mono">
                      <span>{tbl.namespace}</span>
                      <span>•</span>
                      <span>{tbl.columns.length} cols</span>
                      <span>•</span>
                      <span>{tbl.snapshotCount} versions</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Table Details */}
        <div className="lg:col-span-8 space-y-6">
          {activeTable ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              {/* Table Header Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-sc-navy text-sc-green">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-base font-bold text-slate-900 font-mono">
                        {activeTable.identifier}
                      </h2>
                      <span className="text-[11px] font-semibold text-sc-blue bg-sc-blue-light px-2 py-0.5 rounded-full border border-sc-blue/20">
                        Apache Iceberg
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Warehouse location: <span className="font-mono text-slate-700">s3://finance-lake/warehouse/{activeTable.namespace}/{activeTable.tableName}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openHistoryModal(activeTable.tableName)}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                  >
                    <History className="w-4 h-4 text-slate-500" />
                    <span>View Lineage ({activeTable.snapshotCount})</span>
                  </button>

                  <Link
                    to={`/query?table=${activeTable.tableName}`}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-sc-green hover:bg-sc-green-hover text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Terminal className="w-4 h-4" />
                    <span>Query in Studio</span>
                  </Link>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Rows</span>
                  <span className="text-slate-900 font-bold text-sm">
                    {activeTable.totalRows.toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Columns</span>
                  <span className="text-slate-900 font-bold text-sm">
                    {activeTable.columns.length}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Snapshots</span>
                  <span className="text-sc-blue font-bold text-sm">
                    {activeTable.snapshotCount} versions
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Format</span>
                  <span className="text-slate-900 font-bold text-sm">Parquet</span>
                </div>
              </div>

              {/* Schema Columns Table */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Columns3 className="w-4 h-4 text-sc-navy" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Columns & Data Types Schema
                  </h3>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4 font-bold text-[11px] w-12 text-slate-400 text-center border-r border-slate-200">
                          #
                        </th>
                        <th className="py-2.5 px-4 font-bold text-[11px] border-r border-slate-200">
                          Field Name
                        </th>
                        <th className="py-2.5 px-4 font-bold text-[11px] border-r border-slate-200">
                          Physical / Logical Type
                        </th>
                        <th className="py-2.5 px-4 font-bold text-[11px]">
                          Iceberg Compatibility
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      {activeTable.columns.map((col, idx) => (
                        <tr key={col.name} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-4 text-center text-slate-400 border-r border-slate-100">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-4 font-bold text-slate-900 border-r border-slate-100">
                            {col.name}
                          </td>
                          <td className="py-2 px-4 border-r border-slate-100">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                              {col.type}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-sc-green font-medium text-[11px]">
                            Indexed & Queryable
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-400">
              Select a table from the left to view its schema details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

