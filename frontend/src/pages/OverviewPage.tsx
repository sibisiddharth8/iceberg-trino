import { Link } from 'react-router-dom';
import {
  Database,
  Layers,
  UploadCloud,
  Terminal,
  History,
  ArrowRight,
  HardDrive,
  FileSpreadsheet,
} from 'lucide-react';
import { useLakehouse } from '../context/LakehouseContext';

export function OverviewPage() {
  const { tables, openHistoryModal } = useLakehouse();

  const totalRows = tables.reduce((acc, t) => acc + t.totalRows, 0);
  const totalSnapshots = tables.reduce((acc, t) => acc + t.snapshotCount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Welcome / Hero Banner */}
      <div className="bg-gradient-to-r from-sc-navy to-sc-navy-light text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center space-x-2 bg-sc-navy-dark/60 text-sc-green border border-sc-green/30 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-sc-green animate-pulse" />
              <span>Standard Chartered Data Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Financial Analytics Lakehouse
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Query, audit, and analyze banking transaction streams across Apache Iceberg table formats using Trino distributed SQL and MinIO object storage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/ingest"
              className="inline-flex items-center space-x-2 bg-sc-green hover:bg-sc-green-hover text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Ingest Parquet</span>
            </Link>
            <Link
              to="/query"
              className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/20 transition-colors"
            >
              <Terminal className="w-4 h-4 text-slate-300" />
              <span>Open SQL Studio</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Active Iceberg Tables
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {tables.length}
            </div>
            <span className="text-[11px] text-sc-green font-medium flex items-center space-x-1 mt-1">
              <span>Catalog: banking.*</span>
            </span>
          </div>
          <div className="p-3 rounded-xl bg-sc-blue-light text-sc-blue">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Ingested Rows
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {totalRows.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
              Across all dataset versions
            </span>
          </div>
          <div className="p-3 rounded-xl bg-sc-green-light text-sc-green">
            <Database className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Snapshot Commits
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {totalSnapshots}
            </div>
            <span className="text-[11px] text-sc-blue font-medium mt-1 block">
              Time-Travel Available
            </span>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <History className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Object Storage Bucket
            </span>
            <div className="text-sm font-bold text-slate-900 mt-1 font-mono truncate max-w-[140px]">
              finance-lake
            </div>
            <span className="text-[11px] text-sc-green font-medium mt-1 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sc-green" />
              <span>MinIO S3 Online</span>
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Active Banking Tables in Iceberg Catalog
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tables created dynamically from Parquet uploads with schema freezing and snapshot versioning
            </p>
          </div>
          <Link
            to="/ingest"
            className="inline-flex items-center space-x-1.5 text-xs text-sc-blue hover:text-sc-blue-hover font-semibold"
          >
            <span>Ingest new dataset</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {tables.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No tables created yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Upload your first Parquet file or use our 1-click test scenarios to generate banking tables.
            </p>
            <Link
              to="/ingest"
              className="mt-4 inline-flex items-center space-x-2 bg-sc-green text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-sc-green-hover transition-colors"
            >
              <span>Go to Ingestion Portal</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tables.map((table) => (
              <div
                key={table.identifier}
                className="border border-slate-200 hover:border-slate-300 rounded-xl p-5 bg-white shadow-xs transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sc-navy text-sc-green flex items-center justify-center font-bold text-xs">
                      {table.tableName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 font-mono">
                        {table.identifier}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {table.columns.length} columns • Iceberg Format
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-sc-green bg-sc-green-light px-2.5 py-1 rounded-full border border-sc-green/20">
                    {table.totalRows.toLocaleString()} rows
                  </span>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1.5 border border-slate-100 font-mono">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Snapshot Versions:</span>
                    <span className="text-slate-800 font-bold">{table.snapshotCount} commits</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Head Snapshot ID:</span>
                    <span className="text-slate-700 truncate max-w-[150px]">
                      {table.currentSnapshotId || '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => openHistoryModal(table.tableName)}
                    className="inline-flex items-center space-x-1 text-slate-600 hover:text-slate-900 font-medium"
                  >
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>View Lineage ({table.snapshotCount})</span>
                  </button>

                  <Link
                    to={`/query?table=${table.tableName}`}
                    className="inline-flex items-center space-x-1 text-sc-blue hover:text-sc-blue-hover font-semibold"
                  >
                    <span>Query in Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

