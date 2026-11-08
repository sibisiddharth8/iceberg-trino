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
import { PageLoader, Card, MetricCard } from '../components/common';

export function OverviewPage() {
  const { tables, openHistoryModal, isInitialLoading } = useLakehouse();

  const totalRows = tables.reduce((acc, t) => acc + t.totalRows, 0);
  const totalSnapshots = tables.reduce((acc, t) => acc + t.snapshotCount, 0);

  if (isInitialLoading) {
    return (
      <PageLoader
        text="Loading Financial Lakehouse Overview"
        subtext="Fetching catalog tables, snapshot commits, and MinIO storage metrics..."
      />
    );
  }

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
              className="inline-flex items-center space-x-2 bg-sc-green hover:bg-sc-green-hover text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Ingest Parquet</span>
            </Link>
            <Link
              to="/query"
              className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/20 transition-colors cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-slate-300" />
              <span>Open SQL Studio</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid with MetricCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Iceberg Tables"
          value={tables.length}
          theme="blue"
          icon={Layers}
          subtext="Catalog: iceberg.banking.*"
        />

        <MetricCard
          label="Total Ingested Rows"
          value={totalRows.toLocaleString()}
          theme="green"
          icon={Database}
          subtext="Across all dataset versions"
        />

        <MetricCard
          label="Snapshot Commits"
          value={totalSnapshots}
          theme="purple"
          icon={History}
          subtext="Time-Travel & Audit Active"
        />

        <MetricCard
          label="Storage Bucket"
          value="finance-lake"
          theme="amber"
          icon={HardDrive}
          subtext={
            <span className="flex items-center space-x-1 text-sc-green">
              <span className="w-1.5 h-1.5 rounded-full bg-sc-green" />
              <span>MinIO S3 Online</span>
            </span>
          }
        />
      </div>

      {/* Tables Section */}
      <Card className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Active Banking Tables in Iceberg Catalog
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tables created dynamically from Parquet uploads with schema freezing and snapshot versioning
            </p>
          </div>
          <Link
            to="/ingest"
            className="inline-flex items-center space-x-1.5 text-xs text-sc-blue hover:text-sc-blue-hover font-semibold transition-colors"
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
              className="mt-4 inline-flex items-center space-x-2 bg-sc-green text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-sc-green-hover transition-colors cursor-pointer"
            >
              <span>Go to Ingestion Portal</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tables.map((table) => (
              <div
                key={table.identifier}
                className="border border-slate-200/90 hover:border-slate-300 rounded-xl p-5 bg-white shadow-xs hover:shadow-sm transition-all space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-sc-navy text-sc-green flex items-center justify-center font-bold text-xs shrink-0 shadow-xs font-mono">
                        {table.tableName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3
                          className="text-sm font-bold text-slate-900 font-mono truncate"
                          title={table.identifier}
                        >
                          {table.identifier}
                        </h3>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {table.columns.length} columns • Apache Iceberg
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-sc-green bg-sc-green-light px-2.5 py-1 rounded-full border border-sc-green/20 shrink-0">
                      {table.totalRows.toLocaleString()} rows
                    </span>
                  </div>

                  <div className="bg-slate-50/90 rounded-xl p-3 text-xs space-y-2 border border-slate-200/70 font-mono mt-3.5">
                    <div className="flex items-center justify-between text-slate-500 gap-2">
                      <span className="shrink-0 text-[11px]">Snapshot Commits:</span>
                      <span className="text-slate-800 font-bold shrink-0 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {table.snapshotCount} versions
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 gap-2">
                      <span className="shrink-0 text-[11px]">Head Snapshot ID:</span>
                      <span
                        className="text-slate-700 truncate max-w-[170px] text-right text-[11px] select-all"
                        title={table.currentSnapshotId || ''}
                      >
                        {table.currentSnapshotId || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => openHistoryModal(table.tableName)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 transition-colors text-xs shrink-0 cursor-pointer"
                    title={`View ${table.snapshotCount} snapshot versions`}
                  >
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span>Lineage ({table.snapshotCount})</span>
                  </button>

                  <Link
                    to={`/query?table=${table.tableName}`}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-sc-blue-light hover:bg-sc-blue/15 text-sc-blue font-semibold transition-colors text-xs shrink-0 cursor-pointer"
                  >
                    <span>Query in Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
