import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  UploadCloud,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  History,
  FileText,
  Sparkles,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { useLakehouse } from '../context/LakehouseContext';
import { tableService, AppApiError } from '../services';
import { Loader, PageLoader, Card } from '../components/common';
import type {
  SampleItem,
  IngestResponseData,
  SchemaMismatchDetails,
} from '../types';

export function IngestionPage() {
  const { tables, samples, refreshTables, openHistoryModal, isInitialLoading } = useLakehouse();

  const [sourceType, setSourceType] = useState<'link' | 'file'>('link');
  const [s3Path, setS3Path] = useState('s3://finance-lake/uploads/transactions_v1.parquet');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tableName, setTableName] = useState('transactions');
  const [namespace, setNamespace] = useState('banking');

  const [isLoading, setIsLoading] = useState(false);
  const [runningScenarioId, setRunningScenarioId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [droppingTable, setDroppingTable] = useState<string | null>(null);

  const [successResult, setSuccessResult] = useState<IngestResponseData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mismatchDetails, setMismatchDetails] = useState<SchemaMismatchDetails | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  const handleApplySample = (sample: SampleItem) => {
    setSourceType('link');
    setS3Path(sample.s3Uri);
    setTableName(sample.targetTable);
    setSuccessResult(null);
    setErrorMessage(null);
    setMismatchDetails(null);
    setInfoNotice(`Loaded parameters for "${sample.name}". Click "Push Parquet into Iceberg Table" below or edit values.`);
  };

  const handleRunScenario = async (sample: SampleItem) => {
    setRunningScenarioId(sample.id);
    setSourceType('link');
    setS3Path(sample.s3Uri);
    setTableName(sample.targetTable);
    setSuccessResult(null);
    setErrorMessage(null);
    setMismatchDetails(null);
    setInfoNotice(null);

    try {
      const data = await tableService.ingestParquetLink({
        source: sample.s3Uri,
        tableName: sample.targetTable,
        namespace,
      });

      setSuccessResult(data);
      refreshTables();
    } catch (err: any) {
      if (err instanceof AppApiError) {
        setErrorMessage(err.message);
        if (err.code === 'SCHEMA_MISMATCH' && err.details) {
          setMismatchDetails(err.details as SchemaMismatchDetails);
        }
      } else {
        setErrorMessage(err?.message || 'Network error occurred');
      }
    } finally {
      setRunningScenarioId(null);
    }
  };

  const handleIngest = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessResult(null);
    setErrorMessage(null);
    setMismatchDetails(null);
    setInfoNotice(null);

    try {
      let data: IngestResponseData;

      if (sourceType === 'file') {
        if (!selectedFile) {
          throw new Error('Please select a local .parquet file');
        }
        data = await tableService.uploadAndIngestParquet(selectedFile, tableName, namespace);
      } else {
        if (!s3Path.trim()) {
          throw new Error('Please enter a MinIO S3 URI or direct link');
        }
        data = await tableService.ingestParquetLink({
          source: s3Path.trim(),
          tableName: tableName.trim(),
          namespace: namespace.trim(),
        });
      }

      setSuccessResult(data);
      refreshTables();
    } catch (err: any) {
      if (err instanceof AppApiError) {
        setErrorMessage(err.message);
        if (err.code === 'SCHEMA_MISMATCH' && err.details) {
          setMismatchDetails(err.details as SchemaMismatchDetails);
        }
      } else {
        setErrorMessage(err?.message || 'Network error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all Iceberg tables and clear warehouse storage?')) {
      return;
    }

    setIsClearing(true);
    setSuccessResult(null);
    setErrorMessage(null);
    setMismatchDetails(null);
    setInfoNotice(null);

    try {
      const res = await tableService.clearAllTables();
      setInfoNotice(res.message || 'All Iceberg tables successfully cleared. Ready for fresh baseline testing.');
      await refreshTables();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to clear tables');
    } finally {
      setIsClearing(false);
    }
  };

  const handleDropTable = async (tblName: string) => {
    if (!window.confirm(`Are you sure you want to drop table "${tblName}"?`)) {
      return;
    }

    setDroppingTable(tblName);
    try {
      await tableService.dropTable(tblName, namespace);
      setInfoNotice(`Table "${tblName}" dropped successfully.`);
      await refreshTables();
    } catch (err: any) {
      setErrorMessage(err?.message || `Failed to drop table "${tblName}"`);
    } finally {
      setDroppingTable(null);
    }
  };

  if (isInitialLoading) {
    return (
      <PageLoader
        text="Loading Ingestion & Versioning Engine"
        subtext="Fetching available Parquet test scenarios and active catalog tables..."
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Parquet Ingestion & Table Versioning
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Upload Parquet files or specify MinIO storage URIs. The first upload freezes the table schema; subsequent uploads validate schema consistency and append versioned snapshots.
          </p>
        </div>

        {/* Clear / Reset All Tables Button */}
        <button
          type="button"
          onClick={handleClearAll}
          disabled={isClearing || tables.length === 0}
          className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
          title="Drop all Iceberg tables and wipe warehouse data"
        >
          {isClearing ? (
            <Loader size="xs" color="sc" variant="inline" text="Clearing..." />
          ) : (
            <>
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Reset / Clear Catalog ({tables.length})</span>
            </>
          )}
        </button>
      </div>

      {/* Info notice banner */}
      {infoNotice && (
        <div className="p-3.5 rounded-xl bg-sc-blue-light border border-sc-blue/20 text-xs text-sc-blue font-medium flex items-center justify-between animate-in fade-in">
          <span>{infoNotice}</span>
          <button
            onClick={() => setInfoNotice(null)}
            className="text-[11px] underline ml-2 cursor-pointer font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Quick Presets Bar */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-sc-green" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1-Click Test Scenarios (Sample Datasets)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Click <strong>Run Scenario</strong> to execute immediately
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Click <strong>Run Scenario</strong> below to execute immediately with real-time PyIceberg snapshot creation, schema enforcement, or mismatch error rejection:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {samples.map((sample) => {
            const isThisRunning = runningScenarioId === sample.id;
            return (
              <div
                key={sample.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        sample.tag.includes('Error')
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : sample.tag.includes('V1')
                          ? 'bg-sc-blue-light text-sc-blue border border-sc-blue/20'
                          : sample.tag.includes('V2')
                          ? 'bg-sc-green-light text-sc-green-hover border border-sc-green/30'
                          : 'bg-purple-100 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {sample.tag}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono font-medium shrink-0">
                      {sample.records} rows
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {sample.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {sample.description}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplySample(sample)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                    title="Copy URI and parameters to form"
                  >
                    Edit in Form
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRunScenario(sample)}
                    disabled={isThisRunning || isLoading}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-sc-green hover:bg-sc-green-hover active:scale-[0.98] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isThisRunning ? (
                      <Loader size="xs" color="white" variant="inline" text="Executing..." />
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Run Scenario</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 2. Ingestion Form & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Form */}
        <Card className="lg:col-span-7 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-sc-green-light text-sc-green">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Ingestion Configuration
                </h2>
                <p className="text-xs text-slate-500">
                  Target Iceberg catalog: <span className="font-mono font-medium text-slate-700">iceberg.banking</span>
                </p>
              </div>
            </div>

            {/* Source Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSourceType('link')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                  sourceType === 'link'
                    ? 'bg-white text-sc-navy shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>MinIO / S3 Link</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceType('file')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                  sourceType === 'file'
                    ? 'bg-white text-sc-navy shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleIngest} className="space-y-4">
            {sourceType === 'link' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  MinIO S3 URI or Direct Object Link
                </label>
                <input
                  type="text"
                  value={s3Path}
                  onChange={(e) => setS3Path(e.target.value)}
                  placeholder="s3://finance-lake/uploads/transactions_v1.parquet"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-sc-blue/30 focus:border-sc-blue"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Format: <span className="font-mono text-slate-700">s3://finance-lake/uploads/file.parquet</span> or direct MinIO HTTP endpoint.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Local Parquet File (.parquet)
                </label>
                <input
                  type="file"
                  accept=".parquet"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setSelectedFile(f);
                    if (f && !tableName) {
                      setTableName(f.name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                  className="w-full text-xs text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sc-blue-light file:text-sc-blue hover:file:bg-sc-blue-light/80 border border-slate-300 rounded-xl bg-slate-50 p-2 cursor-pointer"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Table Name
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="transactions"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sc-blue/30 focus:border-sc-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Iceberg Namespace
                </label>
                <input
                  type="text"
                  value={namespace}
                  onChange={(e) => setNamespace(e.target.value)}
                  placeholder="banking"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sc-blue/30 focus:border-sc-blue"
                  required
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading || runningScenarioId !== null}
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-white bg-sc-green hover:bg-sc-green-hover active:scale-[0.99] transition-all flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <Loader
                    size="sm"
                    color="white"
                    variant="inline"
                    text="Validating Schema & Pushing to Iceberg..."
                  />
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Push Parquet into Iceberg Table</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Success Banner */}
          {successResult && (
            <div className="mt-6 p-4.5 rounded-xl bg-sc-green-light border border-sc-green/30 text-sc-green-hover space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-sc-green shrink-0" />
                <h4 className="text-xs font-bold text-sc-navy">
                  {successResult.message}
                </h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-white p-3 rounded-lg border border-sc-green/20">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Action:</span>
                  <span className="font-bold text-slate-800 uppercase">{successResult.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Rows Added:</span>
                  <span className="font-bold text-sc-green">+{successResult.rowsAdded}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Rows:</span>
                  <span className="font-bold text-slate-900">{successResult.totalRows.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Snapshot ID:</span>
                  <span className="truncate block text-slate-700">{successResult.snapshotId || '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner (Schema Mismatch / Rejection) */}
          {errorMessage && (
            <div className="mt-6 p-4.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start space-x-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                    Ingestion Rejected: Schema Validation Mismatch
                  </h4>
                  <p className="text-xs text-rose-700 mt-1 font-medium leading-relaxed">{errorMessage}</p>
                </div>
              </div>

              {mismatchDetails && (
                <div className="bg-white border border-rose-200 rounded-lg p-3.5 text-xs space-y-2 font-mono">
                  {mismatchDetails.missingColumns.length > 0 && (
                    <div>
                      <span className="text-rose-700 font-bold">Missing Columns: </span>
                      <span className="text-slate-800">{mismatchDetails.missingColumns.join(', ')}</span>
                    </div>
                  )}
                  {mismatchDetails.extraColumns.length > 0 && (
                    <div>
                      <span className="text-amber-700 font-bold">Unexpected Extra Columns: </span>
                      <span className="text-slate-800">{mismatchDetails.extraColumns.join(', ')}</span>
                    </div>
                  )}
                  {mismatchDetails.typeMismatches.length > 0 && (
                    <div>
                      <span className="text-rose-700 font-bold">Type Incompatibilities:</span>
                      <ul className="list-disc list-inside ml-2 mt-1 text-slate-800">
                        {mismatchDetails.typeMismatches.map((tm) => (
                          <li key={tm.column}>
                            <span className="font-bold">{tm.column}</span>: expected{' '}
                            <span className="text-sc-green font-semibold">{tm.expectedType}</span>, but file contains{' '}
                            <span className="text-rose-600 font-semibold">{tm.actualType}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Right: Active Iceberg Tables List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-sc-green" />
              <span>Catalog Tables ({tables.length})</span>
            </h2>
          </div>

          {tables.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <p className="text-xs text-slate-500 font-medium">
                No Iceberg tables created yet.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Click <strong>"Run Scenario"</strong> on <strong>Scenario 1 (Transactions V1)</strong> above to initialize your first table!
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {tables.map((tbl) => (
                <Card
                  key={tbl.identifier}
                  className="p-4.5 space-y-3 hover:border-slate-300"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <span className="w-2 h-2 rounded-full bg-sc-green shrink-0" />
                      <span className="text-xs font-mono font-bold text-slate-900 truncate" title={tbl.identifier}>
                        {tbl.identifier}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-sc-green bg-sc-green-light px-2.5 py-0.5 rounded-full border border-sc-green/20 shrink-0">
                      {tbl.totalRows.toLocaleString()} rows
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 gap-2">
                    <span className="truncate">
                      <strong className="text-slate-800">{tbl.columns.length}</strong> cols •{' '}
                      <strong className="text-slate-800">{tbl.snapshotCount}</strong> vers
                    </span>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => openHistoryModal(tbl.tableName)}
                        className="inline-flex items-center space-x-1 text-sc-blue hover:text-sc-blue-hover font-semibold px-2 py-0.5 rounded bg-sc-blue-light/50 hover:bg-sc-blue-light border border-sc-blue/20 shrink-0 text-[11px] cursor-pointer"
                      >
                        <History className="w-3 h-3" />
                        <span>Lineage ({tbl.snapshotCount})</span>
                      </button>

                      <button
                        onClick={() => handleDropTable(tbl.tableName)}
                        disabled={droppingTable === tbl.tableName}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title={`Drop table ${tbl.tableName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
