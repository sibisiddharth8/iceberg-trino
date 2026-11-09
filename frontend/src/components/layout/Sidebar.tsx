import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  Terminal,
  Database,
  Layers,
  HardDrive,
  ExternalLink,
  Pin,
  PinOff,
} from 'lucide-react';
import { useLakehouse } from '../../context/LakehouseContext';

export function Sidebar() {
  const { tables, isInitialLoading } = useLakehouse();

  // Collapsible state: default closed (false)
  const [isPinned, setIsPinned] = useState(() => {
    return localStorage.getItem('sidebar_pinned') === 'true';
  });
  const [isHovered, setIsHovered] = useState(false);

  // Both hovering and pinning expand the sidebar in document flow, pushing page contents
  const isExpanded = isPinned || isHovered;

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_pinned', String(next));
      return next;
    });
  };

  const navItems = [
    {
      to: '/',
      label: 'Lakehouse Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/ingest',
      label: 'Parquet Ingestion',
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
      label: 'Iceberg Catalog',
      icon: Database,
      badge: `${tables.length}`,
    },
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-sc-navy flex flex-col text-slate-300 border-r border-sc-navy-dark select-none h-full overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out shrink-0 ${
        isExpanded ? 'w-72' : 'w-16'
      }`}
    >
      {/* Navigation Links */}
      <div className={`flex-1 space-y-1.5 ${isExpanded ? 'p-4' : 'p-2 pt-4'}`}>
        {isExpanded ? (
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Core Workflows
          </div>
        ) : (
          <div className="h-4 flex items-center justify-center mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          </div>
        )}

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            title={item.label}
            className={({ isActive }) =>
              `flex items-center rounded-xl text-xs font-medium transition-all ${
                isExpanded ? 'px-3 py-2.5 justify-between gap-2' : 'justify-center p-3'
              } ${
                isActive
                  ? 'bg-sc-navy-light text-white border-l-4 border-sc-green shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-sc-navy-light/50'
              }`
            }
          >
            <div className="flex items-center min-w-0">
              <item.icon className="w-4 h-4 shrink-0 text-slate-300" />
              {isExpanded && (
                <span className="truncate ml-2.5 font-medium">{item.label}</span>
              )}
            </div>
            {isExpanded && item.badge && (
              <span className="text-[10px] font-semibold font-mono bg-sc-navy-dark text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/60 shrink-0">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

        {/* Quick Tables Section */}
        <div className="pt-5">
          {isExpanded ? (
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Iceberg Tables</span>
              <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
          ) : (
            <div className="flex justify-center py-2 border-t border-slate-800" title="Iceberg Tables">
              <Layers className="w-4 h-4 text-slate-500" />
            </div>
          )}

          <div className="space-y-1 mt-1">
            {isInitialLoading ? (
              isExpanded ? (
                <div className="px-3 py-2.5 space-y-2">
                  <div className="h-3 bg-sc-navy-light/60 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-sc-navy-light/40 rounded animate-pulse w-1/2" />
                </div>
              ) : (
                <div className="flex justify-center py-2">
                  <div className="w-2 h-2 rounded-full bg-sc-green animate-ping" />
                </div>
              )
            ) : tables.length === 0 ? (
              isExpanded ? (
                <p className="px-3 py-2 text-xs text-slate-400 italic">
                  No active tables
                </p>
              ) : null
            ) : (
              tables.map((t) => (
                <NavLink
                  key={t.identifier}
                  to={`/catalog?table=${t.tableName}`}
                  title={`${t.tableName} (${t.totalRows.toLocaleString()} rows)`}
                  className={({ isActive }) =>
                    `flex items-center rounded-xl text-xs text-slate-300 hover:text-white hover:bg-sc-navy-light/40 transition-colors ${
                      isExpanded ? 'justify-between px-3 py-2 gap-2' : 'justify-center p-2.5'
                    } ${isActive ? 'bg-sc-navy-light/60 text-white font-semibold' : ''}`
                  }
                >
                  {isExpanded ? (
                    <>
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-sc-green shrink-0" />
                        <span className="truncate font-mono text-slate-300 group-hover:text-white">
                          {t.tableName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {t.totalRows.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <div className="relative group">
                      <span className="w-2 h-2 rounded-full bg-sc-green block" />
                    </div>
                  )}
                </NavLink>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer / Infrastructure Details & Pin Button */}
      <div className={`border-t border-sc-navy-dark bg-sc-navy-dark/70 text-xs ${isExpanded ? 'p-4 space-y-3' : 'p-2 space-y-2'}`}>
        {isExpanded && (
          <>
            <div className="flex items-center justify-between text-[11px] text-slate-400 gap-2">
              <span className="flex items-center space-x-1.5 shrink-0">
                <HardDrive className="w-3.5 h-3.5 text-sc-green" />
                <span>Warehouse</span>
              </span>
              <span
                className="font-mono text-slate-300 truncate max-w-[130px] text-right"
                title={import.meta.env.VITE_WAREHOUSE_LOCATION || 's3://finance-lake'}
              >
                {import.meta.env.VITE_WAREHOUSE_LOCATION?.replace(/\/warehouse\/?$/, '') || 's3://finance-lake'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 gap-2">
              <span className="shrink-0">MinIO Console</span>
              <a
                href={import.meta.env.VITE_MINIO_CONSOLE_URL || 'http://localhost:9001'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-sc-blue hover:text-white font-mono shrink-0"
              >
                <span>:9001</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-800 leading-tight">
              Standard Chartered • Lakehouse
            </div>
          </>
        )}

        {/* Pin / Keep Open Toggle Button at Bottom Area */}
        <button
          type="button"
          onClick={togglePin}
          className={`w-full flex items-center rounded-xl transition-all border cursor-pointer ${
            isExpanded
              ? 'justify-between px-3 py-2 bg-sc-navy-light/60 hover:bg-sc-navy-light text-slate-200 hover:text-white border-slate-700/60'
              : 'justify-center p-2.5 bg-sc-navy-light/40 hover:bg-sc-navy-light text-slate-300 hover:text-white border-transparent'
          }`}
          title={
            isPinned
              ? 'Sidebar is pinned open (Click to unpin and collapse)'
              : 'Pin sidebar to stay open permanently'
          }
        >
          {isExpanded ? (
            <>
              <div className="flex items-center space-x-2 text-xs font-semibold">
                {isPinned ? (
                  <PinOff className="w-3.5 h-3.5 text-sc-green" />
                ) : (
                  <Pin className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{isPinned ? 'Sidebar Pinned' : 'Keep Open (Pin)'}</span>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                  isPinned
                    ? 'bg-sc-green text-sc-navy font-bold'
                    : 'bg-sc-navy-dark text-slate-400'
                }`}
              >
                {isPinned ? 'LOCKED' : 'PIN'}
              </span>
            </>
          ) : (
            <div>
              {isPinned ? (
                <PinOff className="w-4 h-4 text-sc-green" />
              ) : (
                <Pin className="w-4 h-4 text-slate-400" />
              )}
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
