import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  Terminal,
  Database,
  Layers,
  HardDrive,
  ExternalLink,
} from 'lucide-react';
import { useLakehouse } from '../../context/LakehouseContext';

export function Sidebar() {
  const { tables } = useLakehouse();

  const navItems = [
    {
      to: '/',
      label: 'Lakehouse Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/ingest',
      label: 'Parquet Ingestion & Versioning',
      icon: UploadCloud,
      badge: 'PyIceberg',
    },
    {
      to: '/query',
      label: 'SQL Query Studio',
      icon: Terminal,
      badge: 'Trino SQL',
    },
    {
      to: '/catalog',
      label: 'Iceberg Catalog & Tables',
      icon: Database,
      badge: `${tables.length}`,
    },
  ];

  return (
    <aside className="w-64 bg-sc-navy flex flex-col shrink-0 text-slate-300 border-r border-sc-navy-dark select-none min-h-[calc(100vh-4rem)]">
      {/* Navigation Links */}
      <div className="p-4 flex-1 space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Core Workflows
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-sc-navy-light text-white border-l-4 border-sc-green shadow-sm pl-2'
                  : 'text-slate-300 hover:text-white hover:bg-sc-navy-light/50'
              }`
            }
          >
            <div className="flex items-center space-x-3">
              <item.icon className="w-4 h-4 shrink-0 text-slate-300" />
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className="text-[10px] font-semibold font-mono bg-sc-navy-dark text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/60">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

        {/* Quick Tables Section */}
        <div className="pt-6">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Iceberg Tables</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="space-y-1 mt-1">
            {tables.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400 italic">
                No active tables
              </p>
            ) : (
              tables.map((t) => (
                <NavLink
                  key={t.identifier}
                  to={`/catalog?table=${t.tableName}`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-sc-navy-light/40 group transition-colors"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-sc-green" />
                    <span className="truncate font-mono">{t.tableName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {t.totalRows.toLocaleString()}
                  </span>
                </NavLink>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer / Infrastructure Details */}
      <div className="p-4 border-t border-sc-navy-dark bg-sc-navy-dark/70 text-xs space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center space-x-1.5">
            <HardDrive className="w-3.5 h-3.5 text-sc-green" />
            <span>Warehouse</span>
          </span>
          <span className="font-mono text-slate-300">s3://finance-lake</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>MinIO Console</span>
          <a
            href="http://localhost:9001"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-sc-blue hover:text-white font-mono"
          >
            <span>:9001</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-800">
          Standard Chartered • Financial Markets Data Lake
        </div>
      </div>
    </aside>
  );
}

