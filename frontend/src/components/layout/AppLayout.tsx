import { Outlet, useNavigate } from 'react-router-dom';
import { TopNavbar } from './TopNavbar';
import { Sidebar } from './Sidebar';
import { TableHistoryModal } from '../common/TableHistoryModal';
import { useLakehouse } from '../../context/LakehouseContext';

export function AppLayout() {
  const {
    historyTableName,
    tableHistory,
    isLoadingHistory,
    closeHistoryModal,
    setInjectedQuery,
  } = useLakehouse();

  const navigate = useNavigate();

  const handleSelectTimeTravel = (sql: string) => {
    setInjectedQuery(sql);
    closeHistoryModal();
    navigate('/query');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <TopNavbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      <TableHistoryModal
        tableName={historyTableName}
        history={tableHistory}
        isLoading={isLoadingHistory}
        onClose={closeHistoryModal}
        onSelectTimeTravel={handleSelectTimeTravel}
      />
    </div>
  );
}

