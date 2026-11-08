import { RefreshCw, Server, ShieldCheck, Database } from 'lucide-react';
import scLogo from '../../assets/sc-lock-up-english-grey-rgb.png';
import { useLakehouse } from '../../context/LakehouseContext';

export function TopNavbar() {
  const { tables, isRefreshing, refreshTables } = useLakehouse();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <img
                src={scLogo}
                alt="Standard Chartered"
                className="h-9 w-auto object-contain"
              />
            </div>
            <div className="hidden md:block h-6 w-px bg-slate-200" />
            <div className="hidden md:flex flex-col">
              <span className="text-sm font-semibold text-slate-800 tracking-tight">
                Financial Analytics & Lakehouse Platform
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Enterprise Apache Iceberg & Trino SQL Engine
              </span>
            </div>
          </div>

          {/* Right: Status Badges & Controls */}
          <div className="flex items-center space-x-3">
            {/* Engine cluster indicator */}
            <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Server className="w-3.5 h-3.5 text-sc-blue" />
              <span>Trino v484 • MinIO S3</span>
              <span className="w-1.5 h-1.5 rounded-full bg-sc-green" />
            </div>

            {/* Catalog tables counter */}
            <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>{tables.length} Tables Active</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={refreshTables}
              disabled={isRefreshing}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 hover:border-slate-300"
              title="Refresh Catalog and Data"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sc-green' : ''}`}
              />
            </button>

            {/* Compliance Badge */}
            <div className="hidden sm:flex items-center space-x-1 text-xs text-slate-500 pl-2">
              <ShieldCheck className="w-4 h-4 text-sc-green" />
              <span className="text-[11px] font-medium text-slate-600">Enterprise Edition</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

