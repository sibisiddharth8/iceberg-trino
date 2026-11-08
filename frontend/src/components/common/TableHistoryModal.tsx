import { useState } from 'react';
import { X, GitCommit, Clock, Check, Copy, ArrowRight } from 'lucide-react';
import type { SnapshotHistoryItem } from '../../types';

interface TableHistoryModalProps {
  tableName: string | null;
  history: SnapshotHistoryItem[];
  isLoading: boolean;
  onClose: () => void;
  onSelectTimeTravel?: (query: string) => void;
}

export function TableHistoryModal({
  tableName,
  history,
  isLoading,
  onClose,
  onSelectTimeTravel,
}: TableHistoryModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!tableName) return null;

  const getQueryForSnapshot = (snapshotId: string) => {
    return `SELECT * FROM iceberg.banking.${tableName} FOR VERSION AS OF ${snapshotId} LIMIT 50`;
  };

  const handleCopyTimeTravel = (snapshotId: string) => {
    const sql = getQueryForSnapshot(snapshotId);
    navigator.clipboard.writeText(sql);
    setCopiedId(snapshotId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLoadInStudio = (snapshotId: string) => {
    const sql = getQueryForSnapshot(snapshotId);
    if (onSelectTimeTravel) {
      onSelectTimeTravel(sql);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-sc-navy text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-sc-navy-light text-sc-green">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight">
                Snapshot Lineage & Table Versions
              </h3>
              <p className="text-xs text-slate-300">
                Table: <span className="text-white font-mono font-semibold">banking.{tableName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-sc-navy-light transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="inline-block w-6 h-6 border-2 border-sc-green border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Fetching Iceberg metadata snapshots...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No snapshots recorded for this table yet.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {history.map((snap, index) => {
                const isLatest = index === 0;
                return (
                  <div key={snap.snapshotId} className="relative group">
                    {/* Timeline dot */}
                    <div
                      className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-transform group-hover:scale-125 ${
                        isLatest
                          ? 'bg-sc-green border-white ring-4 ring-sc-green/20'
                          : 'bg-slate-400 border-white'
                      }`}
                    />

                    <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs hover:border-slate-300 transition-all">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                            Version #{history.length - index}
                          </span>
                          {isLatest && (
                            <span className="text-[11px] font-semibold bg-sc-green-light text-sc-green-hover border border-sc-green/30 px-2.5 py-0.5 rounded-full">
                              Active Head Version
                            </span>
                          )}
                          <span className="text-[11px] font-semibold bg-sc-blue-light text-sc-blue border border-sc-blue/20 px-2 py-0.5 rounded-full">
                            {snap.operation}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-slate-500 space-x-1 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(snap.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-700 my-3 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">
                            Snapshot ID:
                          </span>
                          <span className="text-slate-800 text-[11px] select-all break-all">
                            {snap.snapshotId}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">
                            Record Delta:
                          </span>
                          <span className="text-sc-green font-bold">
                            +{snap.addedRecords || '—'} rows
                          </span>{' '}
                          <span className="text-slate-500">
                            (Total: {snap.totalRecords || '—'})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => handleCopyTimeTravel(snap.snapshotId)}
                          className="inline-flex items-center space-x-1.5 text-xs text-sc-blue hover:text-sc-blue-hover font-medium transition-colors"
                        >
                          {copiedId === snap.snapshotId ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-sc-green" />
                              <span className="text-sc-green">Query Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Time-Travel Query</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleLoadInStudio(snap.snapshotId)}
                          className="inline-flex items-center space-x-1 text-xs text-slate-700 hover:text-sc-blue font-semibold transition-colors"
                        >
                          <span>Open in SQL Studio</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

