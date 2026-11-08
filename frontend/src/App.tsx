import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LakehouseProvider } from './context/LakehouseContext';
import { AppLayout } from './components/layout/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { IngestionPage } from './pages/IngestionPage';
import { QueryStudioPage } from './pages/QueryStudioPage';
import { CatalogPage } from './pages/CatalogPage';

export function App() {
  return (
    <LakehouseProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="ingest" element={<IngestionPage />} />
            <Route path="query" element={<QueryStudioPage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LakehouseProvider>
  );
}

export default App;
