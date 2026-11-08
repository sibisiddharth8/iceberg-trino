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
    <div className="h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Fixed Header */}
      <TopNavbar />

      {/* Body containing Pinned Sidebar and Scrollable Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Pinned Left Sidebar */}
        <Sidebar />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
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
