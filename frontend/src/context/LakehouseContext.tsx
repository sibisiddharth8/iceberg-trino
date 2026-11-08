import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { TableSummary, SampleItem, SnapshotHistoryItem } from '../types';

interface LakehouseContextType {
  tables: TableSummary[];
  samples: SampleItem[];
  isRefreshing: boolean;
  refreshTables: () => Promise<void>;
  // History modal
  historyTableName: string | null;
  tableHistory: SnapshotHistoryItem[];
  isLoadingHistory: boolean;
  openHistoryModal: (tableName: string) => Promise<void>;
  closeHistoryModal: () => void;
  // Cross-page query transfer
  injectedQuery: string | null;
  setInjectedQuery: (sql: string | null) => void;
}

const LakehouseContext = createContext<LakehouseContextType | undefined>(undefined);

export function LakehouseProvider({ children }: { children: ReactNode }) {
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [historyTableName, setHistoryTableName] = useState<string | null>(null);
  const [tableHistory, setTableHistory] = useState<SnapshotHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [injectedQuery, setInjectedQuery] = useState<string | null>(null);

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables');
      const body = await res.json();
      if (body.success) {
        setTables(body.data);
      }
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    }
  };

  const fetchSamples = async () => {
    try {
      const res = await fetch('/api/tables/samples');
      const body = await res.json();
      if (body.success) {
        setSamples(body.data);
      }
    } catch (err) {
      console.error('Failed to fetch samples:', err);
    }
  };

  const refreshTables = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchTables(), fetchSamples()]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    refreshTables();
  }, []);

  const openHistoryModal = async (tableName: string) => {
    setHistoryTableName(tableName);
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/tables/${tableName}/history`);
      const body = await res.json();
      if (body.success) {
        setTableHistory(body.data);
      } else {
        setTableHistory([]);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setTableHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const closeHistoryModal = () => {
    setHistoryTableName(null);
    setTableHistory([]);
  };

  return (
    <LakehouseContext.Provider
      value={{
        tables,
        samples,
        isRefreshing,
        refreshTables,
        historyTableName,
        tableHistory,
        isLoadingHistory,
        openHistoryModal,
        closeHistoryModal,
        injectedQuery,
        setInjectedQuery,
      }}
    >
      {children}
    </LakehouseContext.Provider>
  );
}

export function useLakehouse() {
  const context = useContext(LakehouseContext);
  if (!context) {
    throw new Error('useLakehouse must be used within a LakehouseProvider');
  }
  return context;
}

